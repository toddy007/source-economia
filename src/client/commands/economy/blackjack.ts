import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';
import { unabbreviate } from 'util-stunks';
import { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, EmbedBuilder } from 'discord.js';

export default class BlackjackCommand extends Command {
    public constructor() {
        super({
            name: 'blackjack',
            aliases: ['bj', '21'],
            slashCommandData:
                (new SlashCommandBuilder()
                    .setName('blackjack')
                    .setDescription('Jogue blackjack com o bot')
                    .addStringOption(option =>
                        option
                            .setName('quantia')
                            .setDescription('A quantia de moedas a apostar (use "all" para apostar tudo)')
                            .setRequired(true))) as unknown as SlashCommandBuilder
        });
    }

    public async execute({ client, context, args }: CommandPayload) {
        const author = this.getAuthor(context);
        const amountArg = this.getString(context, { name: 'quantia', required: true }) ?? args![0];

        if (!amountArg) 
            return this.reply(context, { content: '❌・Especifique um valor para apostar.', flags: MessageFlags.Ephemeral });
        const authorAmount = (client.db.get(`users.${author.id}.amount`) ?? 0) as number;
        const amount = amountArg.toLowerCase() === 'all' ? authorAmount : unabbreviate(amountArg);

        if (isNaN(amount) || amount <= 0) 
            return this.reply(context, { content: '❌・O valor a ser apostado deve ser um número positivo.', flags: MessageFlags.Ephemeral });
        if (amount > authorAmount) 
            return this.reply(context, { content: '❌・Você não tem moedas suficientes para apostar.', flags: MessageFlags.Ephemeral });

        client.db.sub(`users.${author.id}.amount`, amount);

        const firstCard = gerarCartas();
        const playerHand = [firstCard, gerarCartas()];
        const dealerHand = [firstCard, gerarCartas()];

        let playerTotal = playerHand.reduce((a, b) => a + b, 0);
        let dealerTotal = dealerHand.reduce((a, b) => a + b, 0);

        const embed = new EmbedBuilder()
            .setTitle('[🃏] Blackjack')
            .setDescription('💥・Hit: pega mais uma carta\n✋・Stand: mantém as cartas e deixa o dealer jogar')
            .setTimestamp()

        const firstField = {
            name: 'Suas cartas',
            value: `${playerHand.join(', ')} (Total: ${playerTotal})`,
            inline: true
        };

        const secondField = {
            name: 'Cartas do dealer',
            value: `${dealerHand[0]}, ? (Total: ?)`,
            inline: true
        };

        embed.setFields(firstField, secondField);

        const hitButton = new ButtonBuilder()
            .setCustomId('hit')
            .setLabel('Hit')
            .setEmoji('💥')
            .setStyle(ButtonStyle.Primary);

        const standButton = new ButtonBuilder()
            .setCustomId('stand')
            .setLabel('Stand')
            .setEmoji('✋')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitButton, standButton);

        const message = await this.reply(context, { embeds: [embed], components: [row], withResponse: true }) as Message<true>;

        async function disableButtons() {
            hitButton.setDisabled(true);
            standButton.setDisabled(true);
            row.setComponents(hitButton, standButton);
            
            message.edit({ components: [row] });
        }

        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === author.id });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'hit') {
                const newCard = gerarCartas();
                playerHand.push(newCard);
                playerTotal += newCard;

                if (playerTotal > 21) {
                    message.reply(`💥・Você estourou! Você perdeu **${amount}** moedas.`);

                    await disableButtons();

                    return collector.stop('lose');
                }

                if (playerTotal === 21) {
                    message.reply(`🎉・Parabéns! Você fez 21 e ganhou **${amount}** moedas!`);

                    await disableButtons();

                    return collector.stop('win');
                }

                firstField.value = `${playerHand.join(', ')} (Total: ${playerTotal})`;
                embed.setFields(firstField, secondField);
                message.edit({ embeds: [embed] });
            }

            if (interaction.customId === 'stand') {
                await disableButtons();
                
                while (dealerTotal < 17) {
                    const newCard = gerarCartas();
                    dealerHand.push(newCard);
                    dealerTotal += newCard;

                    secondField.value = `${dealerHand.join(', ')} (Total: ${dealerTotal})`;
                    embed.setFields(firstField, secondField); 
                    message.edit({ embeds: [embed] });
                }

                if (dealerTotal > 21 || playerTotal > dealerTotal) {
                    message.reply(`🎉・Parabéns! Você ganhou **${amount}** moedas!`);
                    return collector.stop('win');
                } else if (dealerTotal === playerTotal) {
                    message.reply('🤝・Empate! Sua aposta foi devolvida.');
                    return collector.stop('draw');
                } else {
                    message.reply(`😢・O dealer ganhou! Você perdeu **${amount}** moedas.`);
                    return collector.stop('lose');
                }
            }
        });

        collector.on('end', async (_, reason) => {
            switch (reason) {
                case 'win':
                    return client.db.sum(`users.${author.id}.amount`, amount * 2);
                case 'draw':
                    return client.db.sum(`users.${author.id}.amount`, amount);
                case 'lose':
                    return;
            }
        });
    }
}

function gerarCartas() {
  return Math.floor(Math.random() * 10) + 1
}