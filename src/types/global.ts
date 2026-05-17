import { Message, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Client } from '../structure/Client';

export interface CommandPayload {
    client: Client<true>,
    context: Message<true> | ChatInputCommandInteraction,
    args?: string[],
}

export interface Command {
    name: string,
    aliases: string[],
    slashCommandData?: SlashCommandBuilder,
    execute: (payload: CommandPayload) => unknown,
}

export interface CommandConstructor {
    name: string,
    aliases?: string[],
    slashCommandData?: SlashCommandBuilder
}