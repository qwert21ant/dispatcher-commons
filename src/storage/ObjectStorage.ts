import { Mutator } from "../models";
import { ScopedStorage } from "./ScopedStorage";

export class ObjectStorage<O> {
  private obj?: O;

  public constructor(
    private baseStorage: ScopedStorage,
    private filename: string,
    private defaults?: O,
  ) {}

  public get(): O {
    if (!this.obj)
      throw new Error("Object not loaded");

    return this.obj; // todo: copy? dont forget about mutate
  }

  public async mutate(mutator: Mutator<O>): Promise<void> {
    mutator(this.get());
    await this.store(this.get());
  }

  public async load(): Promise<O> {
    if (this.obj) return this.obj;

    if (this.defaults)
      return this.obj = await this.baseStorage.loadJsonWithDefaults(this.filename, this.defaults);
    else
      return this.obj = await this.baseStorage.loadJson(this.filename);
  }

  public async store(obj: O): Promise<void> {
    this.obj = obj; // TODO: copy
    return this.baseStorage.storeJson(this.filename, obj);
  }
}