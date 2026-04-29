import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';

export default class AtmCommand extends Command {
    public constructor() {
        super({
            name: 'atm',
            aliases: ['bal', 'balance'],
        });
    }

    public async execute({ client, message }: CommandPayload) {
        const amount = await client.db.get(`users.${message.author.id}.amount`) ?? 0;
        message.reply('🪙・Você tem **' + amount + '** moedas.');
    }
}