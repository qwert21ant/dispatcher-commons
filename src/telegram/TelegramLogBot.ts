import { Stream } from "stream";
import { TelegramBasicBot } from "./TelegramBasicBot";
import { LoggerEx, LogLevel } from "../logger";
import { escapeString } from "../utils";
import { ILogger, ILoggerEx } from "../interfaces";
import { TelegramLogBotOptions } from "../models/TelegramLogBotOptions";

export class TelegramLogBot extends TelegramBasicBot<TelegramLogBotOptions> {
  private pendingAction: Promise<void> = Promise.resolve();

  public constructor(
    logger: ILogger,
    options: TelegramLogBotOptions,
    printChatInfo: boolean = false
  ) {
    super(logger, options, printChatInfo);
  }

  protected async onStarted(): Promise<void> {
    await this.sendMessageMul("------------- NEW SESSION -------------");

    this.logger.success("Telegram log bot launched");
  }

  private scheduleAction(action: Promise<void>) {
    const prevAction = this.pendingAction;
    this.pendingAction = (async () => {
      await prevAction;
      await action;
    })();
  }

  private async sendMessageMul(message: string): Promise<void> {
    console.log(message);
    message = message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
    message = "`" + escapeString(message) + "`";
    await Promise.all(this.options.chatIds.map(chatId => this.sendMessage(chatId, message)));
  }

  private async sendPhotoMul(path: string): Promise<void> {
    await Promise.all(this.options.chatIds.map(chatId => this.sendPhoto(chatId, path)));
  }

  private async sendFileMul(data: string | Stream | Buffer, fileName: string = "file.txt", mimeType: string = "text/plain"): Promise<void> {
    await Promise.all(this.options.chatIds.map(chatId => this.sendFile(chatId, data, fileName, mimeType)));
  }

  protected async onStopped(): Promise<void> {}

  public createLogger(level: LogLevel = LogLevel.info, scope?: string): ILoggerEx {
    return new LoggerEx(
      (msg) => this.scheduleAction(this.sendMessageMul(msg)),
      (path) => this.scheduleAction(this.sendPhotoMul(path)),
      (data, fileName, mimeType) => this.scheduleAction(this.sendFileMul(data, fileName, mimeType)),
      level,
      scope,
    );
  }
}