import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';

export default class RankCommand extends Command {
    public constructor() {
        super({
            name: 'rank',
            aliases: ['leaderboard', 'top'],
            slashCommandData: 
                new SlashCommandBuilder()
                    .setName('rank')
                    .setDescription('Mostra o ranking dos usuários com mais moedas')
        });
    }

    public async execute({ client, context }: CommandPayload) {
        const author = this.getAuthor(context);

        const users = client.db.get('users') ?? {};
        const sortedUsers = Object.entries(users).sort((a, b) => {
            const amountA = a[1].amount ?? 0;
            const amountB = b[1].amount ?? 0;
            return amountB - amountA;
        });
        
        let currentPage = 1;

        const embed = new EmbedBuilder()
            .setTitle('[🏅] Ranking de Moedas]')
            .setDescription(sortedUsers.slice(0, 10).map(([userId, userData], index) => {
                const amount = userData.amount ?? 0;
                return `**${index + 1}.** <@${userId}> - \`${amount}\` moedas`;
            }).join('\n'))
            .setColor('Gold')
            .setTimestamp()

        const backButton = new ButtonBuilder()
            .setCustomId('back')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)

        const nextButton = new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

        const msg = await this.reply(context, { embeds: [embed], components: [row], withResponse: true });

        const collector = msg.createMessageComponentCollector({ filter: interaction => interaction.user.id === author.id, time: 120000 });

        collector.on('collect', async interaction => {
            const isBack = interaction.customId === 'back';
            currentPage += isBack ? -1 : 1;

            if (currentPage === 1)
                backButton.setDisabled(true);
            else 
                backButton.setDisabled(false);

            if (isBack)
                nextButton.setDisabled(false);
            else {
                const sliced = sortedUsers.slice(currentPage * 10, (currentPage + 1) * 10);
                if (!sliced[0])
                    nextButton.setDisabled(true);
            }

            const sliced = sortedUsers.slice((currentPage - 1) * 10, currentPage * 10);
                
            embed.setDescription(sliced.map(([userId, userData], index) => {
                const amount = userData.amount ?? 0;
                return `**${(currentPage - 1) * 10 + index + 1}.** <@${userId}> - \`${amount}\` moedas`;
            }).join('\n'));

            msg.edit({ embeds: [embed], components: [row] });
            interaction.deferUpdate();
        });
    }
}