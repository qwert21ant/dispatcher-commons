import { Stream } from "node:stream";

export interface IReporter {
  message(text: string): Promise<void>;
  image(path: string): Promise<void>;
  file(data : string | Stream | Buffer, fileName?: string, mimeType?: string): Promise<void>;
}
