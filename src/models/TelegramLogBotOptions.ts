import { CommonTelegramBotOptions } from "./CommonTelegramBotOptions";

export interface TelegramLogBotOptions extends CommonTelegramBotOptions {
  chatIds: number[];
}
