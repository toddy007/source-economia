import { Message, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Client } from '../structure/Client';

export type Context = Message<true> | ChatInputCommandInteraction;

export interface CommandPayload<T extends Context> {
    client: Client<true>,
    context: T,
    args: T extends Message<true> ? string[] : never;
}

export interface Command {
    name: string,
    aliases: string[],
    slashCommandData?: SlashCommandBuilder,
    execute: <T extends Context>(payload: CommandPayload<T>) => unknown,
}

export interface CommandConstructor {
    name: string,
    aliases?: string[],
    slashCommandData?: SlashCommandBuilder
}