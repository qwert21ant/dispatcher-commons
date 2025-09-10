import { Stream } from "node:stream";
import { ILogger } from "./ILogger";
import { LogLevel } from "../logger";

export interface ILoggerEx extends ILogger {
  with(opts: { level?: LogLevel, scope?: string }): ILoggerEx;

  image(path: string): void;
  file(data: string | Stream | Buffer, fileName?: string, mimeType?: string): void;
}