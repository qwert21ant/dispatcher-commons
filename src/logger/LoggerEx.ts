import { Logger } from "./Logger";
import { Stream } from "node:stream";
import { LogLevel } from "./LogLevel";
import { ILoggerEx } from "../interfaces";

export class LoggerEx extends Logger implements ILoggerEx {
  constructor(
    logFunc: (message: string) => void,
    private imageFunc: (path: string) => void,
    private fileFunc: (data: string | Stream | Buffer, fileName?: string, mimeType?: string) => void,
    level: LogLevel = LogLevel.info,
    scope?: string,
  ) {
    super(logFunc, level, scope);
  }

  public with(opts: { level?: LogLevel; scope?: string; }): ILoggerEx {
    return new LoggerEx(this.logFunc, this.imageFunc, this.fileFunc, opts.level ?? this.level, opts.scope ?? this.scope);
  }

  public image(path: string): void {
    this.imageFunc(path);
  }

  public file(data: string | Stream | Buffer, fileName?: string, mimeType?: string): void {
    this.fileFunc(data, fileName, mimeType);
  }
}
