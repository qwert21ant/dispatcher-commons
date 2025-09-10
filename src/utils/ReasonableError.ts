export class ReasonableError extends Error {
  public constructor(
    message: string,
    public reason: Error,
  ) {
    super(message);
    this.name = "ReasonableError";
  }
}
