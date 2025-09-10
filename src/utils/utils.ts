import { isNull, isUndefined } from "lodash";
import { ReasonableError } from "./ReasonableError";
import { ParallelRepeater, RepeaterAction } from "./Repeater";
import Stream from "node:stream";
import { ILogger } from "../interfaces";

export function sleep(millis: number): Promise<void> {
  return new Promise(res => setTimeout(res, millis));
}

export function formatDate(date: Date): string {
  let res = "";
  res += date.getFullYear() + "-";
  res += (date.getMonth() + 1).toString().padStart(2, '0') + "-";
  res += date.getDate().toString().padStart(2, '0');
  return res;
}

export function escapeString(str: any): string {
  if (isNull(str))
    return "$null";
  if (isUndefined(str))
    return "$undefined";

  str = str.toString();
  str = str.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
  return str;
}

export async function tryPerform<T>(
  action: () => Promise<T> | T,
  maxAttempts: number,
  delay?: number,
  logger?: ILogger,
): Promise<T> {
  let error;
  for (let iAttempt = 0; iAttempt < maxAttempts; iAttempt++) {
    try {
      return await action();
    } catch (e) {
      error = e;
      if (logger)
        logger.error(e);
    }

    if (delay)
      await sleep(delay);
  }

  throw new ReasonableError("Max number of attempts has been reached", error);
}

export async function wrapCatch<T>(
  action: () => Promise<T> | T,
  errorMessage: string,
): Promise<T> {
  try {
    return await action();
  } catch (e) {
    throw new ReasonableError(errorMessage, e);
  }
}

export async function wrapMuteError<T>(
  action: () => Promise<T> | T,
  logger?: ILogger,
): Promise<T | undefined> {
  try {
    return await action();
  } catch (e) {
    if (logger)
      logger.error(e);
    return undefined;
  }
}

// export async function wrapMuteLoggers<T>( // error logs are not muted
//   action: () => Promise<T> | T,
//   loggers: ILogger[],
// ): Promise<T | undefined> {
//   loggers.forEach(logger => logger.mute());
//   try {
//     const res = await action();
//     loggers.forEach(logger => logger.unmute());
//     return res;
//   } catch (e) {
//     loggers.forEach(logger => logger.unmute());
//     throw e;
//   }
// }

export async function repeaterWithTL<T>(
  action: RepeaterAction<T>,
  delay: number,
  timeLimit: number,
): Promise<T> {
  return new ParallelRepeater<T>()
    .add(action, delay)
    .add((_, reject) => reject(new Error("Time limit exceeded")), timeLimit, false)
    .wait();
}

export function readStreamFully(stream: Stream.Readable): Promise<Buffer> {
  return new Promise((res, rej) => {
    const chunks = [];

    stream.on("error", rej);

    stream.on("end", () => {
      res(Buffer.concat(chunks));
    });

    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
  });
}
