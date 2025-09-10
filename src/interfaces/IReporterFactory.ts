import { IReporter } from "./IReporter";

export interface IReporterFactory {
  createReporter(workerName: string): IReporter;
}
