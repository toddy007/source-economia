import { Event } from '../../structure/Event';
import { Events, Message, PermissionFlagsBits } from 'discord.js';
import { client } from '../..';

export default class MessageCreateEvent extends Event {
    public name = Events.MessageCreate;

    public async execute(message: Message<true>) {
        if (message.author.bot || !message.inGuild()) return;
        if (!message.guild.members.me!.permissions.has(
            PermissionFlagsBits.SendMessages
        )) 
            return;

        const clientMention = '<@' + client.user.id + '>';
        if (message.content.startsWith(clientMention)) 
            return message.reply('Hi!');

        if (message.content.startsWith(client.config.prefix)) {
            const args = message.content.slice(client.config.prefix.length).split(' ');
            const commandName = args.shift()!.toLowerCase();

            const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if (!command) return;

            return command.execute({
                client,
                message,
                args,
            });
        }
    }
}