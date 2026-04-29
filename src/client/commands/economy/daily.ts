import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { relativeTime } from 'util-stunks';

export default class DailyCommand extends Command {
    public constructor() {
        super({
            name: 'daily',
            aliases: ['diário', 'diario'],
        });
    }

    public async execute({ client, message }: CommandPayload) {
        const cooldown = (await client.db.get(`users.${message.author.id}.cooldowns.daily`) ?? 0) as number;
        if (cooldown > Date.now()) {
            const remaining = relativeTime(Date.now() - cooldown);
            return message.reply('⏱️・Você já coletou seu daily, espere: `' + remaining + '`.');
        }

        const daily = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
        const oneDay = 1000 * 60 * 60 * 24;
        await client.db.set(`users.${message.author.id}.cooldowns.daily`, Date.now() + oneDay);
        await client.db.sum(`users.${message.author.id}.amount`, daily);
        
        message.reply('🎉・Você coletou seu daily e recebeu **' + daily + '** moedas!');
    }
}