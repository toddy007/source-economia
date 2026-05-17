import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';

export default class PayCommand extends Command {
    public constructor() {
        super({
            name: 'pay',
            aliases: ['pagar'],
            slashCommandData:
                (new SlashCommandBuilder()
                    .setName('pay')
                    .setDescription('Pague moedas para outro usuário')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('O usuário para quem você deseja pagar')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('quantia')
                            .setDescription('A quantia de moedas a pagar (use "all" para pagar tudo)')
                            .setRequired(true)
                    )) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);
        const user = this.getUser(context, { name: 'user', required: true }) ?? client.users.cache.get(args![0]);
        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![1];

        if (!user) 
            return this.reply(context, { content: '❌・Mencione um usuário ou forneça o ID para pagar.', flags: MessageFlags.Ephemeral });
        if (user.bot) 
            return this.reply(context, { content: '❌・Você não pode pagar um bot.', flags: MessageFlags.Ephemeral });
        if (user.id === author.id) 
            return this.reply(context, { content: '❌・Você não pode pagar a si mesmo.', flags: MessageFlags.Ephemeral });
        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para pagar.', flags: MessageFlags.Ephemeral });

        const userAmount = client.db.get(`users.${author.id}.amount`) as number;
        const amount = amountArg.toLowerCase() === 'all' ? userAmount : unabbreviate(amountArg);

        if (isNaN(amount) || amount <= 0) 
            return this.reply(context, { content: '❌・O valor a ser pago deve ser um número positivo.', flags: MessageFlags.Ephemeral });
        if (amount > userAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para pagar.', flags: MessageFlags.Ephemeral });

        client.db.sub(`users.${author.id}.amount`, amount);
        client.db.sum(`users.${user.id}.amount`, amount);

        context.reply(`✅・Você pagou **${amount}** moedas para <@${user.id}>.`); // colocar botao 
    }
}