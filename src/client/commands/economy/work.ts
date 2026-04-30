import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { relativeTime } from 'util-stunks';

export default class WorkCommand extends Command {
    public constructor() {
        super({
            name: 'work',
            aliases: ['trabalhar', 'trabalho'],
        });
    }

    public async execute({ client, message }: CommandPayload) {
        const cooldown = (await client.db.get(`users.${message.author.id}.cooldowns.work`) ?? 0) as number;
        if (cooldown > Date.now()) {
            const remaining = relativeTime(cooldown - Date.now(), { compact: true, removeMs: true, includeMsInSeconds: true });
            return message.reply('⏱️・Você já trabalhou, espere: `' + remaining + '`.');
        }

        const work = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
        const halfHour = 1000 * 60 * 30;
        await client.db.set(`users.${message.author.id}.cooldowns.work`, Date.now() + halfHour);
        await client.db.sum(`users.${message.author.id}.amount`, work);
        
        message.reply('💼・Você trabalhou e recebeu **' + work + '** moedas.');
    }
}