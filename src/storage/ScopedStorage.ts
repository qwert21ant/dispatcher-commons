import path from "path";
import fs from "fs-extra";
import _ from "lodash";

export class ScopedStorage {
  public constructor(
    private basePath: string,
  ) {}

  public async init(): Promise<void> {
    await fs.ensureDir(this.basePath);
  }

  public async loadJson<O>(file: string): Promise<O> {
    return fs.readJson(path.join(this.basePath, file));
  }

  public async loadJsonWithDefaults<O>(file: string, defaults: O): Promise<O> {
    if (!await fs.pathExists(path.join(this.basePath, file)))
      return defaults;

    return _.merge(defaults, await this.loadJson(file));
  }

  public async storeJson<O>(file: string, json: O): Promise<void> {
    return fs.writeJson(path.join(this.basePath, file), json);
  }

  public async createStorage(subPath: string): Promise<ScopedStorage> {
    const res = new ScopedStorage(path.join(this.basePath, subPath));
    await res.init();
    return res;
  }
}