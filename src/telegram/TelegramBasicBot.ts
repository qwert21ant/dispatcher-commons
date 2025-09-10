import TelegramBot, { Message, InlineKeyboardButton } from "node-telegram-bot-api";
import { Stream } from "node:stream";
import { CommonTelegramBotOptions } from "../models";
import { ILogger } from "../interfaces";

export type BotCommands = Record<string, {
  description: string;
  usage: string;
  example?: string;
  handler: (msg: Message) => Promise<boolean>;
}>;

export class TelegramBasicBot<Options extends CommonTelegramBotOptions> {
  protected bot: TelegramBot;

  public constructor(
    protected logger: ILogger,
    protected options: Options,
    printChatInfo: boolean = false,
  ) {
    this.bot = new TelegramBot(options.apiToken, { polling: false });

    if (printChatInfo) {
      this.bot.on("message", (msg) => {
        this.logger.info(`Message from chat: ${msg.chat.id} ${"title" in msg.chat ? msg.chat.title : ""}`);
      });
    }
  }

  public async start(): Promise<void> {
    await this.bot.startPolling();
    await this.onStarted();
  }

  protected async onStarted(): Promise<void> {
    this.logger.success("Telegram bot launched");
  }

  public async stop(): Promise<void> {
    await this.bot.stopPolling();
    await this.onStopped();
  }

  protected async onStopped(): Promise<void> {
    this.logger.info("Telegram bot stopped");
  }

  protected async registerCommands(commands: BotCommands): Promise<void> {
    await this.bot.setMyCommands(
      Object.keys(commands).map(cmd => ({
        command: cmd,
        description: commands[cmd].description,
      })),
    );

    const botInfo = await this.bot.getMe();
    const botUsername = botInfo.username;

    this.bot.on("message", async (msg) => {
      if (!this.options.chatIds.includes(msg.chat.id)) return;

      try {
        if (!await this.onMessage(msg)) return;
      } catch (e) {
        this.logger.error(e);
        return;
      }

      if (!msg.text || msg.text[0] != "/") return;

      let command = msg.text.split(" ")[0].slice(1);
      if (command.endsWith(`@${botUsername}`))
        command = command.split('@')[0];

      if (!commands[command]) return;

      try {
        if (!await commands[command].handler(msg)) {
          await this.reply(
            msg,
            "Invalid arguments\n" +
            "Usage: " + commands[command].usage + "\n" +
            (
              commands[command].example
              ? "Example: " + commands[command].example
              : ""
            ),
          );
        }
      } catch (e) {
        this.logger.error(e);
        return;
      }
    });
  }

  protected async onMessage(msg: Message): Promise<boolean> {
    return true;
  }

  protected async reply(msg: Message, message: string): Promise<void> {
    await this.bot.sendMessage(msg.chat.id, message, {
      parse_mode: "MarkdownV2",
      reply_to_message_id: msg.message_id,
    });
  }

  protected async sendOrEdit(chatId: number, text: string, msgId?: number, keyboard?: InlineKeyboardButton[][]): Promise<void> {
    const replyMarkup = keyboard ? { inline_keyboard: keyboard } : undefined;
    if (msgId)
      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: replyMarkup,
        parse_mode: "MarkdownV2",
      });
    else
      await this.bot.sendMessage(chatId, text, {
        reply_markup: replyMarkup,
        parse_mode: "MarkdownV2",
      });
  }

  protected async sendMessage(chatId: number, message: string): Promise<void> {
    await this.bot.sendMessage(
      chatId,
      message,
      { parse_mode: "MarkdownV2" },
    );
  }

  protected async sendPhoto(chatId: number, path: string): Promise<void> {
    await this.bot.sendPhoto(
      chatId,
      path,
    );
  }

  protected async sendFile(chatId: number, data: string | Stream | Buffer, fileName: string = "file.txt", mimeType: string = "text/plain"): Promise<void> {
    await this.bot.sendDocument(chatId, data, {}, {
      filename: fileName,
      contentType: mimeType,
    });
  }
}