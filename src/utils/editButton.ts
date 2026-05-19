import { ButtonBuilder, Snowflake } from "discord.js";

export function editButton(button: ButtonBuilder, accepted: Snowflake[]) {
    const label = `[${accepted.length}/2] Confirmar`;
    button.setLabel(label);
}