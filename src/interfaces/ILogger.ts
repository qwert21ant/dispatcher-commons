import { LogLevel } from "../logger";

export interface ILogger {
  level: LogLevel;
  scope?: string;

  with(opts: { level?: LogLevel, scope?: string }): ILogger;

  info(message: any);
  success(message: any);
  warning(message: any);
  error(message: string | Error | object);
}