import chalk from "chalk";
import { ReasonableError } from "../utils";
import { LogLevel } from "./LogLevel";
import { ILogger } from "../interfaces";

export class Logger implements ILogger {
  constructor(
    protected logFunc: (message: string) => void,
    public level: LogLevel = LogLevel.info,
    public scope?: string,
  ) {}

  public with(opts: { level?: LogLevel; scope?: string; }): ILogger {
    return new Logger(this.logFunc, opts.level ?? this.level, opts.scope ?? this.scope);
  }

  public info(message: any) {
    if (this.level < LogLevel.info) return;

    this.log("[" + chalk.bold.white("INFO") + "]", this.processMessage(message));
  }

  public error(message: string | Error | object) {
    if (this.level < LogLevel.error) return;

    if (typeof message === "string") {
      this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red(message));
    } else if (message instanceof ReasonableError) {
      const error = message as ReasonableError;
      this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red(error.stack));
      this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red("Reason:"));
      this.error(error.reason);
    } else if (message instanceof Error) {
      const error = message as Error;
      this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red(error.stack));
    } else if (typeof message === "object") {
      try {
        const str = JSON.stringify(message, null, 2);
        this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red(str));
      } catch (e) {
        this.log("[" + chalk.bold.red("ERROR") + "]", chalk.red(`Unknown object: ${message}. See console.log output for more info`));
        console.log(message);
      }
    }
  }

  public warning(message: any) {
    if (this.level < LogLevel.warn) return;

    this.log("[" + chalk.bold.yellow("WARNING") + "]", chalk.yellow(this.processMessage(message)));
  }

  public success(message: any) {
    if (this.level < LogLevel.info) return;

    this.log("[" + chalk.bold.green("SUCCESS") + "]", chalk.green(this.processMessage(message)));
  }

  private log(prefix: string, message: string) {
    this.logFunc(prefix + " " + (this.scope ? ("[" + chalk.bold.white(this.scope) + "] ") : "") + message);
  }

  private processMessage(message: any): string {
    if (typeof message === "object")
      return JSON.stringify(message, null, 2);
    return message.toString();
  }
}
