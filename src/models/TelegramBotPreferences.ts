export interface TelegramBotPreferences {
  utc: number;

  chatToWorkerMap: Record<number, string>;
}
