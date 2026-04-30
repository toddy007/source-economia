import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';

export default class SacCommand extends Command {
    public constructor() {
        super({
            name: 'sacar',
            aliases: ['saque', 'sac'],
        });
    }

    public async execute({ client, message, args }: CommandPayload) {
        const [amountArg] = args;
        if (!amountArg) 
            return message.reply('❌・Especifique um valor para sacar.');
        
        const userAmount = await client.db.get(`users.${message.author.id}.bank`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);
        if (isNaN(amount) || amount <= 0) 
            return message.reply('❌・Valor inválido para sacar.');
        if (amount > userAmount) 
            return message.reply('❌・Você não tem moedas suficientes para sacar.');

        await client.db.sub(`users.${message.author.id}.amount`, amount);
        await client.db.sum(`users.${message.author.id}.bank`, amount);
        
        message.reply('✅・Você sacou **' + amount + '** moedas do banco.');

    }
}