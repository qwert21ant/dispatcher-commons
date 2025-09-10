import { wrapMuteError } from "./utils";

export type RepeaterAction<T> =
  (
    resolve: (result: T) => void,
    reject: (error: Error) => void,
  ) => Promise<void> | void;

export interface Repeater<T> {
  wait(): Promise<T>;
}

export class SingleRepeater<T> implements Repeater<T> {
  private resolved: boolean = false;
  private rejected: boolean = false;
  private result: T | Error;

  public constructor(
    private action: RepeaterAction<T>,
    private delay: number,
  ) {}

  public wait(): Promise<T> {
    this.resolved = false;
    this.rejected = false;
    this.result = undefined;

    return new Promise<T>((resolve, reject) => {
      const resolveAction = (result: T) => {
        this.result = result;
        this.resolved = true;
      };

      const rejectAction = (error: Error) => {
        this.result = error;
        this.rejected = true;
      };

      const scheduleNext = async () => {
        await wrapMuteError(() => this.action(resolveAction, rejectAction));

        if (!this.resolved && !this.rejected) {
          setTimeout(() => scheduleNext(), this.delay);
          return;
        }

        if (this.resolved)
          resolve(this.result as T);
        else
          reject(this.result);
      };

      scheduleNext();
    });
  }
}

export class ParallelRepeater<T> implements Repeater<T> {
  private actions: {
    action: RepeaterAction<T>,
    delay: number,
    instantRun: boolean,
  }[] = [];

  private resolved: boolean = false;
  private rejected: boolean = false;
  private result: T | Error;

  public add(action: RepeaterAction<T>, delay: number, instantRun: boolean = true): ParallelRepeater<T> {
    this.actions.push({
      action, delay, instantRun
    });
    return this;
  }

  public wait(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timersContainer: NodeJS.Timeout[] = new Array(this.actions.length).fill(null);

      const resolveAction = (result: T) => {
        this.result = result;
        this.resolved = true;
      };

      const rejectAction = (error: Error) => {
        this.result = error;
        this.rejected = true;
      };

      const finish = () => {
        timersContainer.forEach(timer => clearTimeout(timer));

        if (this.resolved)
          resolve(this.result as T);
        else
          reject(this.result);
      };

      for (let i = 0; i < this.actions.length; i++) {
        const scheduleNext = async () => {
          await wrapMuteError(() => this.actions[i].action(resolveAction, rejectAction));

          if (!this.resolved && !this.rejected) {
            timersContainer[i] = setTimeout(() => scheduleNext(), this.actions[i].delay);
            return;
          }

          finish();
        };

        if (this.actions[i].instantRun)
          scheduleNext();
        else
          timersContainer[i] = setTimeout(() => scheduleNext(), this.actions[i].delay);
      }
    });
  }
}