import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { relativeTime } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default class WorkCommand extends Command {
    public constructor() {
        super({
            name: 'work',
            aliases: ['trabalhar', 'trabalho'],
            slashCommandData:
                new SlashCommandBuilder()
                    .setName('trabalhar')
                    .setDescription('Trabalhe para ganhar moedas')
        });
    }

    public async execute({ client, context }: CommandPayload) {
        const author = this.getAuthor(context);

        const cooldown = (client.db.get(`users.${author.id}.cooldowns.work`) ?? 0) as number;
        if (cooldown > Date.now()) {
            const remaining = relativeTime(cooldown - Date.now(), { compact: true, removeMs: true, includeMsInSeconds: true });
            return this.reply(context, { content: '⏱️・Você já trabalhou, espere: `' + remaining + '`.', flags: MessageFlags.Ephemeral });
        }

        const work = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
        const halfHour = 1000 * 60 * 30;
        client.db.set(`users.${author.id}.cooldowns.work`, Date.now() + halfHour);
        client.db.sum(`users.${author.id}.amount`, work);
        
        context.reply('💼・Você trabalhou e recebeu **' + work + '** moedas.');
    }
}