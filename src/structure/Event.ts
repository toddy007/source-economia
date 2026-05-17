import { Events } from "discord.js";

export abstract class Event {
    public constructor(
        public name: Events,
    ) {};

    public abstract execute(payload: unknown): unknown;
}