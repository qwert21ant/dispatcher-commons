import { ILogger } from "../logger";
import { sleep } from "./utils";

export interface RateLimiterOptions {
  /** Delay between requests in milliseconds */
  delay: number;
  /** Maximum queue size before logging warnings */
  maxQueueSize: number;
  /** Log warning every N queued items after maxQueueSize is reached */
  logInterval: number;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private lastLoggedQueueSize = 0;

  constructor(
    private logger: ILogger,
    private options: RateLimiterOptions,
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        execute: operation,
        resolve,
        reject,
      };

      this.queue.push(queuedRequest);
      this.checkQueueSize();
      this.processQueue();
    });
  }

  private checkQueueSize(): void {
    const queueSize = this.queue.length;
    
    if (queueSize > this.options.maxQueueSize) {
      // Log warning every logInterval items after maxQueueSize is reached
      if (queueSize >= this.lastLoggedQueueSize + this.options.logInterval) {
        this.logger.warning(`Telegram API request queue is getting large: ${queueSize} pending requests`);
        this.lastLoggedQueueSize = queueSize;
      }
    } else {
      // Reset the logged queue size when it goes below the threshold
      this.lastLoggedQueueSize = this.options.maxQueueSize;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Wait for the delay if not enough time has passed
      if (timeSinceLastRequest < this.options.delay) {
        const waitTime = this.options.delay - timeSinceLastRequest;
        await sleep(waitTime);
      }

      const request = this.queue.shift();
      if (!request) {
        break;
      }

      try {
        this.lastRequestTime = Date.now();
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessing = false;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public isQueueEmpty(): boolean {
    return this.queue.length === 0;
  }
}