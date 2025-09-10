import { Writable } from "node:stream";
import { Logger } from "./Logger";

export class StreamLogger extends Logger {
  constructor(
    private stream: Writable,
  ) {
    super((msg) => {
      this.stream.write(msg + "\n");
    });
  }
}
