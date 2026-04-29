import { Command } from '../../../structure/Command';
import { CommandPayload } from '../../../types/global';

export default class PingCommand extends Command {
    public constructor() {
        super({
            name: 'ping',
            aliases: ['pong'],
        });
    }

    public async execute({ client, message }: CommandPayload) {
        message.reply('Pong! `' + client.ws.ping + 'ms`');
    }
}