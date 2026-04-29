import { Client } from './structure/Client';

export const client = new Client<true>({ intents: [33281] }); // intents in https://discord-intents-calculator.vercel.app/

client.run();