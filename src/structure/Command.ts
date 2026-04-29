import { CommandPayload, CommandConstructor } from '../types/global';

export class Command {
    public name: string;
    public aliases?: string[];
    
    public constructor({
        name,
        aliases,
    }: CommandConstructor) {
        this.name = name;
        this.aliases = aliases ?? [];
    };

    public execute(payload: CommandPayload) {};
}