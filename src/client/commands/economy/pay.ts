import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';

export default class PayCommand extends Command {
    public constructor() {
        super({
            name: 'pay',
            aliases: ['pagar'],
        });
    }

    public async execute({ client, message, args }: CommandPayload) {
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        const amountArg = args[1];

        if (!user) 
            return message.reply('❌・Mencione um usuário ou forneça o ID para pagar.');
        if (user.bot) 
            return message.reply('❌・Você não pode pagar um bot.');
        if (user.id === message.author.id) 
            return message.reply('❌・Você não pode pagar a si mesmo.');
        if (!amountArg) 
            return message.reply('❌・Especifique um valor para pagar.');

        const userAmount = await client.db.get(`users.${message.author.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);

        if (amount <= 0) 
            return message.reply('❌・O valor a ser pago deve ser um número positivo.');
        if (amount > userAmount) 
            return message.reply('❌・Você não tem moedas suficientes para pagar.');

        await client.db.sub(`users.${message.author.id}.amount`, amount);
        await client.db.sum(`users.${user.id}.amount`, amount);

        message.reply(`✅・Você pagou **${amount}** moedas para <@${user.id}>.`); // colocar botao 
    }
}