export class Event {
    public constructor(
        public name: string,
    ) {};

    public execute(payload: unknown) {};
}