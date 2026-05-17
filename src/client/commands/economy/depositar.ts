import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default class DepCommand extends Command {
    public constructor() {
        super({
            name: 'depositar',
            aliases: ['dep'],
            slashCommandData:
                (new SlashCommandBuilder()
                    .setName('depositar')
                    .setDescription('Deposite moedas no banco')
                    .addStringOption(option =>
                        option.setName('quantia')
                            .setDescription('A quantia de moedas a depositar (use "all" para depositar tudo)')
                            .setRequired(true)
                    )) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);

        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![0];
        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para depositar.', flags: MessageFlags.Ephemeral });
        
        const userAmount = client.db.get(`users.${author.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);
        if (isNaN(amount) || amount <= 0) 
            return this.reply(context, { content: '❌・Valor inválido para depositar.', flags: MessageFlags.Ephemeral });
        if (amount > userAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para depositar.', flags: MessageFlags.Ephemeral });

        client.db.sub(`users.${author.id}.amount`, amount);
        client.db.sum(`users.${author.id}.bank`, amount);
        
        context.reply('✅・Você depositou **' + amount + '** moedas no banco.');

    }
}