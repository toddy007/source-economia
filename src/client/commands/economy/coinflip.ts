import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

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
        const user = this.getUser(context, { name: 'user', required: true }) ?? (await client.users.fetch(args![0]).catch(() => null));
        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![1];

        if (!user) 
            return this.reply(context, { content: '❌・Mencione um usuário ou forneça o ID para apostar.', flags: MessageFlags.Ephemeral });
        if (user.bot) 
            return this.reply(context, { content: '❌・Você não pode apostar com um bot.', flags: MessageFlags.Ephemeral });
        if (user.id === author.id) 
            return this.reply(context, { content: '❌・Você não pode apostar com si mesmo.', flags: MessageFlags.Ephemeral });
        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para apostar.', flags: MessageFlags.Ephemeral });

        const authorAmount = await client.db.get(`users.${author.id}.amount`) as number;
        const userAmount = await client.db.get(`users.${user.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? authorAmount : unabbreviate(amountArg);

        if (amount <= 0) 
            return this.reply(context, { content: '❌・O valor a ser apostado deve ser um número positivo.', flags: MessageFlags.Ephemeral });
        if (amount > authorAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para apostar.', flags: MessageFlags.Ephemeral });
        if (amount > userAmount)
            return this.reply(context, { content: '❌・O usuário mencionado não tem moedas suficientes para apostar.', flags: MessageFlags.Ephemeral });

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

        await client.db.sub(`users.${loser.id}.amount`, amount);
        await client.db.sum(`users.${winner.id}.amount`, amount);

        this.reply(context, `✅・O vencedor foi <@${winner.id}> com resultado ${flipResult} e o perdedor ( <@${loser.id}> ) pagou **${amount}** moedas.`); 
    }
}