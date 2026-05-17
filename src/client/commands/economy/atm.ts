import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { SlashCommandBuilder } from 'discord.js';

export default class AtmCommand extends Command {
    public constructor() {
        super({
            name: 'atm',
            aliases: ['bal', 'balance'],
            slashCommandData: 
                new SlashCommandBuilder()
                    .setName('saldo')
                    .setDescription('Mostra o saldo da carteira e do banco')
        });
    }

    public async execute({ client, context }: CommandPayload) {
        const author = this.getAuthor(context);
        
        const amount = await client.db.get(`users.${author.id}.amount`) ?? 0;
        const bank = await client.db.get(`users.${author.id}.bank`) ?? 0;

        this.reply(context, '[💵] Saldo\n🪙・Carteira**' + amount + '** moedas.\n🏦・Banco**' + bank + '** moedas.');
    }
}