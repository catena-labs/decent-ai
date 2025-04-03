import { type Message } from "./message"

export function senderName(message: Message) {
  return message.role === "user" ? "You" : "DecentAI"
}
