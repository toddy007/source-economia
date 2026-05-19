import { MessageFlags, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Snowflake } from 'discord.js';
import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';
import { editButton } from '../../../utils/editButton';

export default class PayCommand extends Command {
    public constructor() {
        super({
            name: 'pay',
            aliases: ['pagar'],
            slashCommandData:
                (new SlashCommandBuilder()
                    .setName('pay')
                    .setDescription('Pague moedas para outro usuário')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('O usuário para quem você deseja pagar')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('quantia')
                            .setDescription('A quantia de moedas a pagar (use "all" para pagar tudo)')
                            .setRequired(true)
                    )) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);
        const user = this.getUser(context, { name: 'user', required: true }) ?? client.users.cache.get(args![0]);
        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![1];

        if (!user) 
            return this.reply(context, { content: '❌・Mencione um usuário ou forneça o ID para pagar.', flags: MessageFlags.Ephemeral });
        if (user.bot) 
            return this.reply(context, { content: '❌・Você não pode pagar um bot.', flags: MessageFlags.Ephemeral });
        if (user.id === author.id) 
            return this.reply(context, { content: '❌・Você não pode pagar a si mesmo.', flags: MessageFlags.Ephemeral });
        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para pagar.', flags: MessageFlags.Ephemeral });

        const userAmount = (client.db.get(`users.${author.id}.amount`) ?? 0) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);

        if (isNaN(amount) || amount <= 0) 
            return this.reply(context, { content: '❌・O valor a ser pago deve ser um número positivo.', flags: MessageFlags.Ephemeral });
        if (amount > userAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para pagar.', flags: MessageFlags.Ephemeral });

        const button = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('[0/2] Confirmar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✅')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        const msg = await this.reply(context, { content: `⚠️・Os dois precisam confirmar o pagamento.`, components: [row], withResponse: true }) as Message<true>;

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
                const actualAmount = (client.db.get(`users.${author.id}.amount`) ?? 0) as number;
                if (actualAmount < amount) {
                    msg.reply('❌・O pagamento falhou, o usuario não tem moedas suficientes.');
                    return collector.stop('cancelled');
                }

                client.db.sub(`users.${author.id}.amount`, amount);
                client.db.sum(`users.${user.id}.amount`, amount);

                msg.reply(`✅・Pagamento de ${amount} moedas para ${user} confirmado!`);
                collector.stop('success');
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'cancelled')
                return msg.edit({ content: '❌・Pagamento cancelado devido a falta de confirmações.', components: [] });
            
            if (reason === 'success') {
                button.setStyle(ButtonStyle.Success).setDisabled(true);
                row.setComponents(button);
                return msg.edit({ components: [row] });
            }

            return msg.edit({ content: '⌛・Tempo esgotado.', components: [] });
        });
    }
}
