import TelegramBot, { Message, InlineKeyboardButton } from "node-telegram-bot-api";
import { Stream } from "node:stream";
import { BotCommands, BotKeyboardButton, BotKeyboardData, BotKeyboardHandlers, CommonTelegramBotOptions } from "../models";
import { ILogger } from "../logger";
import { RateLimiter } from "../utils";

export class TelegramBasicBot<Options extends CommonTelegramBotOptions> {
  protected bot: TelegramBot;

  public constructor(
    protected logger: ILogger,
    protected rateLimiter: RateLimiter | null,
    protected options: Options,
    printChatInfo: boolean = false,
  ) {
    this.bot = new TelegramBot(options.apiToken, { polling: false });

    if (!this.rateLimiter) {
      this.rateLimiter = new RateLimiter(this.logger, {
        delay: 600,
        maxQueueSize: 20,
        logInterval: 5,
      });
    }

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
      if (!await this.acceptMessage(msg)) return;

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

  protected async registerKeyboardHandlers(handlers: BotKeyboardHandlers): Promise<void> {
    this.bot.on("callback_query", async (cb) => {
      const data = JSON.parse(cb.data) as BotKeyboardData;

      if (handlers[data.op]) {
        try {
          await handlers[data.op](cb.from.id, cb.message.message_id, data.data);
        } catch (e) {
          this.logger.error(e);
        }
      } else {
        this.logger.error(`Unknown cb operation: ${data.op}`);
      }
    });
  }

  protected async acceptMessage(msg: Message): Promise<boolean> {
    return false;
  }

  protected async onMessage(msg: Message): Promise<boolean> {
    return true;
  }

  protected async reply(msg: Message, message: string): Promise<void> {
    await this.rateLimiter.execute(() =>
      this.bot.sendMessage(msg.chat.id, message, {
        parse_mode: "MarkdownV2",
        reply_to_message_id: msg.message_id,
      })
    );
  }

  protected async delete(msgId: number, chatId: number): Promise<void> {
    await this.rateLimiter.execute(() =>
      this.bot.deleteMessage(chatId, msgId)
    );
  }

  protected async sendOrEdit(chatId: number, text: string, msgId?: number, keyboard?: BotKeyboardButton[][]): Promise<void> {
    const replyMarkup = keyboard ? { inline_keyboard: mapKeyboard(keyboard) } : undefined;
    
    if (msgId) {
      await this.rateLimiter.execute(() =>
        this.bot.editMessageText(text, {
          chat_id: chatId,
          message_id: msgId,
          reply_markup: replyMarkup,
          parse_mode: "MarkdownV2",
        })
      );
    } else {
      await this.rateLimiter.execute(() =>
        this.bot.sendMessage(chatId, text, {
          reply_markup: replyMarkup,
          parse_mode: "MarkdownV2",
        })
      );
    }
  }

  protected async sendMessage(chatId: number, message: string): Promise<void> {
    await this.rateLimiter.execute(() =>
      this.bot.sendMessage(
        chatId,
        message,
        { parse_mode: "MarkdownV2" },
      )
    );
  }

  protected async sendPhoto(chatId: number, path: string): Promise<void> {
    await this.rateLimiter.execute(() =>
      this.bot.sendPhoto(
        chatId,
        path,
      )
    );
  }

  protected async sendFile(chatId: number, data: string | Stream | Buffer, fileName: string = "file.txt", mimeType: string = "text/plain"): Promise<void> {
    await this.rateLimiter.execute(() =>
      this.bot.sendDocument(chatId, data, {}, {
        filename: fileName,
        contentType: mimeType,
      })
    );
  }

  protected createBKBtn(op: string, text: string, data?: any): BotKeyboardButton {
    return {
      text,
      payload: {
        op,
        data,
      },
    };
  }
}

function mapKeyboard(keyboard?: BotKeyboardButton[][]): InlineKeyboardButton[][] | undefined {
  if (!keyboard)
    return undefined;

  return keyboard.map(line => line.map(btn => ({
    text: btn.text,
    callback_data: JSON.stringify(btn.payload),
  })));
}