import { Event } from '../../structure/Event';
import { Events } from 'discord.js';
import { client } from '../..';

export default class ReadyEvent extends Event {
    public name = Events.ClientReady;

    public execute() {
        console.log(client.user.username + ' is ready');
    }
}