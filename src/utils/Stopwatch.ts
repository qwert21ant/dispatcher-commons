export class Stopwatch {
  private _time: number = 0;
  private _point: number = 0;

  public constructor() {
    this.reset();
  }

  public get time(): number {
    return (performance.now() - this._time) / 1000;
  }

  public interval(): number {
    const point = this._point;
    this._point = performance.now();
    return (performance.now() - point) / 1000;
  }

  public reset(): void {
    this._time = performance.now();
    this._point = this._time;
  }
}
