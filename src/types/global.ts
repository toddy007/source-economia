import { Message } from 'discord.js';
import { Client } from '../structure/Client';

export interface CommandPayload {
    client: Client<true>,
    message: Message<true>,
    args: string[],
}

export interface Command {
    name: string,
    aliases: string[],
    execute: (payload: CommandPayload) => void,
}

export interface CommandConstructor {
    name: string,
    aliases?: string[],
}