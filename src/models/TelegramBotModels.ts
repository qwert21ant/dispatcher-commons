import { Message } from "node-telegram-bot-api";

export type BotCommands = Record<string, {
  description: string;
  usage: string;
  example?: string;
  handler: (msg: Message) => Promise<boolean>;
}>;

export type BotKeyboardData = {
  op: string;
  data?: any;
};

export type BotKeyboardButton = {
  text: string;
  payload: BotKeyboardData;
};

export type BotKeyboardHandlers = Record<
  string,
  (userId: number, msgId: number, data?: any) => Promise<void>
>;

export type BotState<Op = string> = {
  op: Op;
  data?: any;
};