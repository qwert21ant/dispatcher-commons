import { RateLimiterOptions } from "../utils";

export interface CommonTelegramBotOptions {
  apiToken: string;
  rateLimit?: Partial<RateLimiterOptions>;
}
