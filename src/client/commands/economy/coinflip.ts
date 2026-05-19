import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, Snowflake, Message } from 'discord.js';
import { editButton } from '../../../utils/editButton';

export default class CoinflipCommand extends Command {
    public constructor() {
        super({
            name: 'coinflip',
            aliases: ['caracoroa', 'coin', 'cf'],
            slashCommandData:
                (new SlashCommandBuilder()
                    .setName('coinflip')
                    .setDescription('Aposte moedas com outro usuário em um jogo de cara ou coroa')
                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription('O usuário com quem você quer apostar')
                            .setRequired(true))
                    .addStringOption(option =>
                        option
                            .setName('quantia')
                            .setDescription('A quantia de moedas a apostar (use "all" para apostar tudo)')
                            .setRequired(true))) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);
        const user = this.getUser(context, { name: 'user', required: true }) ?? client.users.cache.get(args![0]);
        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![1];

        if (!user) 
            return this.reply(context, { content: '❌・Mencione um usuário ou forneça o ID para apostar.', flags: MessageFlags.Ephemeral });
        if (user.bot) 
            return this.reply(context, { content: '❌・Você não pode apostar com um bot.', flags: MessageFlags.Ephemeral });
        if (user.id === author.id) 
            return this.reply(context, { content: '❌・Você não pode apostar com si mesmo.', flags: MessageFlags.Ephemeral });
        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para apostar.', flags: MessageFlags.Ephemeral });

        const authorAmount = (client.db.get(`users.${author.id}.amount`) ?? 0) as number;
        const userAmount = (client.db.get(`users.${user.id}.amount`) ?? 0) as number;
        const amount = amountArg.toLowerCase() === 'all' ? authorAmount : unabbreviate(amountArg);

        if (isNaN(amount) || amount <= 0) 
            return this.reply(context, { content: '❌・O valor a ser apostado deve ser um número positivo.', flags: MessageFlags.Ephemeral });
        if (amount > authorAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para apostar.', flags: MessageFlags.Ephemeral });
        if (amount > userAmount)
            return this.reply(context, { content: '❌・O usuário mencionado não tem moedas suficientes para apostar.', flags: MessageFlags.Ephemeral });

        const button = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('[0/2] Confirmar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✅')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        const msg = await this.reply(context, { content: `⚠️・Os dois precisam confirmar a aposta.`, components: [row], withResponse: true }) as Message<true>;

        const accepted: Snowflake[] = [];

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === author.id || i.user.id === user.id, time: 90000 });

        collector.on('collect', (interaction) => {
            if (accepted.includes(interaction.user.id) && accepted.length < 2) {
                const index = accepted.indexOf(interaction.user.id);
                accepted.splice(index, 1);
                interaction.reply({ content: '✅・Cancelado.', flags: MessageFlags.Ephemeral });

                editButton(button, accepted);
                row.setComponents(button);
                msg.edit({ components: [row] });
            } else if (!accepted.includes(interaction.user.id)) {
                accepted.push(interaction.user.id);
                interaction.reply({ content: '✅・Confirmado.', flags: MessageFlags.Ephemeral });

                editButton(button, accepted);
                row.setComponents(button);
                msg.edit({ components: [row] });
            }

            if (accepted.length === 2) {
                const authorActualAmount = (client.db.get(`users.${author.id}.amount`) ?? 0) as number;
                const userActualAmount = (client.db.get(`users.${user.id}.amount`) ?? 0) as number;
                if (authorActualAmount < amount || userActualAmount < amount) {
                    msg.reply('❌・A aposta falhou, um dos usuários não tem moedas suficientes.');
                    return collector.stop('cancelled');
                }

                const results = ['cara', 'coroa'];
                const flipResult = results[Math.floor(Math.random() * 2)];
        
                let winner;
                let loser;
                if (flipResult === 'cara') {
                    winner = user;
                    loser = author;
                } else {
                    winner = author;
                    loser = user;
                }

                client.db.sub(`users.${loser.id}.amount`, amount);
                client.db.sum(`users.${winner.id}.amount`, amount);
                
                msg.reply(`✅・O usuario ${winner} ganhou a aposta de **${amount}** moedas! O resultado foi **${flipResult}**.`);
                collector.stop('success');
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'cancelled')
                return msg.edit({ content: '❌・Aposta cancelada devido a falta de confirmações.', components: [] });
            
            if (reason === 'success') {
                button.setStyle(ButtonStyle.Success).setDisabled(true);
                row.setComponents(button);
                return msg.edit({ components: [row] });
            }

            return msg.edit({ content: '⌛・Tempo esgotado.', components: [] });
        });
    }
}