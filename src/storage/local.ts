import pfs from "fs/promises";
import fs from "fs";
import mime from "mime";
import path from "path";
import { Readable } from "stream";
import { IBlobStorage } from "./interface.js";
import { logger } from "../logger.js";

export class LocalStorage implements IBlobStorage {
  log = logger.extend("storage:local");
  dir: string;
  files: string[] = [];

  constructor(dir: string) {
    this.dir = dir;
  }
  async setup(): Promise<void> {
    this.files = await pfs.readdir(this.dir);
    this.log(`Found ${this.files.length} in ${this.dir}`);
  }
  private getBlobFilename(sha256: string) {
    return this.files.find((f) => f.startsWith(sha256));
  }
  async hasBlob(hash: string): Promise<boolean> {
    return this.files.some((name) => name.startsWith(hash));
  }
  async readBlob(hash: string): Promise<Readable> {
    const file = this.getBlobFilename(hash);
    if (!file) throw new Error("Missing blob");

    return fs.createReadStream(path.join(this.dir, file));
  }
  writeBlob(
    sha256: string,
    stream: Readable,
    type?: string | undefined
  ): Promise<void> {
    return new Promise((res) => {
      const ext = type ? mime.getExtension(type) : null;
      const filename = sha256 + (ext ? "." + ext : "");
      const filepath = path.join(this.dir, filename);
      stream.pipe(fs.createWriteStream(filepath));
      stream.on("end", async () => {
        this.files.push(filename);
        res();
      });
    });
  }
  async getBlobSize(sha256: string): Promise<number> {
    const filename = this.getBlobFilename(sha256);
    if (!filename) throw new Error("Missing blob");
    const filepath = path.join(this.dir, filename);
    const stats = await pfs.stat(filepath);
    return stats.size;
  }
  async removeBlob(sha256: string): Promise<void> {
    const file = this.files.find((f) => f.startsWith(sha256));
    if (!file) throw new Error("Missing blob");

    await pfs.rm(path.join(this.dir, file));
    this.files.splice(this.files.indexOf(file), 1);
  }
}
