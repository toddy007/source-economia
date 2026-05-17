import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { relativeTime } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default class DailyCommand extends Command {
    public constructor() {
        super({
            name: 'daily',
            aliases: ['diário', 'diario'],
            slashCommandData: 
                new SlashCommandBuilder()
                    .setName('diario')
                    .setDescription('Coleta seu daily e receba uma quantia de moedas')
        });
    }

    public async execute({ client, context }: CommandPayload) {
        const author = this.getAuthor(context);

        const cooldown = (client.db.get(`users.${author.id}.cooldowns.daily`) ?? 0) as number;
        if (cooldown > Date.now()) {
            const remaining = relativeTime(cooldown - Date.now(), { compact: true, removeMs: true, includeMsInSeconds: true });
            return this.reply(context, { content: '⏱️・Você já coletou seu daily, espere: `' + remaining + '`.', flags: MessageFlags.Ephemeral });
        }

        const daily = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
        const oneDay = 1000 * 60 * 60 * 24;
        client.db.set(`users.${author.id}.cooldowns.daily`, Date.now() + oneDay);
        client.db.sum(`users.${author.id}.amount`, daily);

        context.reply('🎉・Você coletou seu daily e recebeu **' + daily + '** moedas!');
    }
}