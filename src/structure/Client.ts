import { Client as DiscordClient, Collection } from 'discord.js';
import globSync from 'tiny-glob';
import { Command } from '../types/global';
import { Config } from '../client/Config';

export class Client<R extends boolean> extends DiscordClient<R> {
    public commands = new Collection<string, Command>();

    public config = Config;

    public async run() {
        this.loadCmds();
        this.loadEvents();

        this.login(process.env.CLIENT_TOKEN);
    }

    private async loadCmds() {
        const commands = await globSync('./src/client/commands/**/*.ts');

        for (const command of commands) {
            const { default: CommandClass } = await import('../../'+command);
            const cmd = new CommandClass();

            this.commands.set(cmd.name, cmd);
        }
    }

    private async loadEvents() {
        const events = await globSync('./src/client/events/*.ts');

        for (const event of events) {
            const { default: EventClass } = await import('../../'+event);
            const evt = new EventClass();

            this.on(evt.name, evt.execute);
        }
    }
}