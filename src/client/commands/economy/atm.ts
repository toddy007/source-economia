import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { SlashCommandBuilder } from 'discord.js';

export default class AtmCommand extends Command {
    public constructor() {
        super({
            name: 'atm',
            aliases: ['bal', 'balance'],
            slashCommandData: 
                (new SlashCommandBuilder()
                    .setName('saldo')
                    .setDescription('Mostra o saldo da carteira e do banco')
                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription('Um usuario para ver o saldo'))) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);
        const user = this.getUser(context, { name: 'user' }) || client.users.cache.get(args ? args[0] : '') || author;
        
        const amount = client.db.get(`users.${user.id}.amount`) ?? 0;
        const bank = client.db.get(`users.${user.id}.bank`) ?? 0;

        context.reply('[💵] Saldo de ' + user + '\n🪙・Carteira**' + amount + '** moedas.\n🏦・Banco**' + bank + '** moedas.');
    }
}