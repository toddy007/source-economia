import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';

export default class CoinflipCommand extends Command {
    public constructor() {
        super({
            name: 'coinflip',
            aliases: ['caracoroa', 'coin', 'cf'],
        });
    }

    public async execute({ client, message, args }: CommandPayload) {
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        const amountArg = args[1];

        if (!user) 
            return message.reply('❌・Mencione um usuário ou forneça o ID para apostar.');
        if (user.bot) 
            return message.reply('❌・Você não pode apostar com um bot.');
        if (user.id === message.author.id) 
            return message.reply('❌・Você não pode apostar com si mesmo.');
        if (!amountArg) 
            return message.reply('❌・Especifique um valor para apostar.');

        const authorAmount = await client.db.get(`users.${message.author.id}.amount`) as number;
        const userAmount = await client.db.get(`users.${user.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? authorAmount : unabbreviate(amountArg);

        if (amount <= 0) 
            return message.reply('❌・O valor a ser apostado deve ser um número positivo.');
        if (amount > authorAmount) 
            return message.reply('❌・Você não tem moedas suficientes para apostar.');
        if (amount > userAmount)
            return message.reply('❌・O usuário mencionado não tem moedas suficientes para apostar.');

        const results = ['cara', 'coroa'];
        const flipResult = results[Math.floor(Math.random() * 2)];
        
        let winner;
        let loser;
        if (flipResult === 'cara') {
            winner = user;
            loser = message.author;
        } else {
            winner = message.author;
            loser = user;
        }

        await client.db.sub(`users.${loser.id}.amount`, amount);
        await client.db.sum(`users.${winner.id}.amount`, amount);

        message.reply(`✅・O vencedor foi <@${winner.id}> com resultado ${flipResult} e o perdedor ( <@${loser.id}> ) pagou **${amount}** moedas.`); // colocar botao 
    }
}