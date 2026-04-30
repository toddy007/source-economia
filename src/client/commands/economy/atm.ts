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
        const bank = await client.db.get(`users.${message.author.id}.bank`) ?? 0;

        message.reply('[💵] Saldo\n🪙・Carteira**' + amount + '** moedas.\n🏦・Banco**' + bank + '** moedas.');
    }
}