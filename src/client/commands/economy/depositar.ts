import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';

export default class DepCommand extends Command {
    public constructor() {
        super({
            name: 'depositar',
            aliases: ['dep'],
        });
    }

    public async execute({ client, message, args }: CommandPayload) {
        const [amountArg] = args;
        if (!amountArg) 
            return message.reply('❌・Especifique um valor para depositar.');
        
        const userAmount = await client.db.get(`users.${message.author.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);
        if (isNaN(amount) || amount <= 0) 
            return message.reply('❌・Valor inválido para depositar.');
        if (amount > userAmount) 
            return message.reply('❌・Você não tem moedas suficientes para depositar.');

        await client.db.sub(`users.${message.author.id}.amount`, amount);
        await client.db.sum(`users.${message.author.id}.bank`, amount);
        
        message.reply('✅・Você depositou **' + amount + '** moedas no banco.');

    }
}