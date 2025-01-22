import { Readable } from "node:stream";
import { Client, ClientOptions } from "minio";
import mime from "mime";

import { logger } from "../logger.js";
import { IBlobStorage } from "./interface.js";

export type S3StorageOptions = Omit<
  ClientOptions,
  "endPoint" | "accessKey" | "secretKey"
>;

export class S3Storage implements IBlobStorage {
  log = logger.extend("storage:s3");
  client: Client;
  bucket: string;
  publicURL: string | undefined = undefined;

  /** cached array of objects that are stored in the s3 bucket */
  objects: { name: string; size: number }[] = [];

  constructor(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
    options?: S3StorageOptions,
  ) {
    this.client = new Client({
      endPoint: endpoint,
      accessKey: accessKey,
      secretKey: secretKey,
      ...options,
    });

    this.bucket = bucket;
  }

  private loadObjects() {
    return new Promise<void>(async (res) => {
      this.log(`Loading objects...`);
      this.objects = [];
      const stream = await this.client.listObjectsV2(this.bucket);
      stream.on("data", (object) => {
        if (object.name)
          this.objects.push({ name: object.name, size: object.size });
      });
      stream.on("end", () => {
        this.log(`Finished loading objects (${this.objects.length})`);
        res();
      });
    });
  }
  async setup() {
    const buckets = await this.client.listBuckets();
    const bucket = buckets.find((b) => b.name === this.bucket);
    if (bucket) this.log("Found bucket", this.bucket);
    else throw new Error("Cant find bucket " + this.bucket);

    await this.loadObjects();
  }
  private getBlobObject(sha256: string) {
    return this.objects.find((obj) => obj.name?.startsWith(sha256));
  }
  private createObjectName(sha256: string, type?: string) {
    const ext = type ? mime.getExtension(type) : null;
    return sha256 + (ext ? "." + ext : "");
  }

  async hasBlob(sha256: string): Promise<boolean> {
    return !!this.getBlobObject(sha256);
  }
  async listBlobs(): Promise<string[]> {
    const hashes: string[] = [];
    for (const object of this.objects) {
      const hash = object.name.match(/^[0-9a-f]{64}/)?.[0];
      if (hash) hashes.push(hash);
    }
    return hashes;
  }
  async writeBlob(
    sha256: string,
    stream: Readable | Buffer,
    type?: string | undefined,
  ): Promise<void> {
    const name = this.createObjectName(sha256, type);
    let size = 0;
    await this.client.putObject(this.bucket, name, stream, undefined, {
      "x-amz-acl": "public-read",
      "Content-Type": type,
    });

    if (stream instanceof Buffer) {
      size = stream.length;
    } else if (stream instanceof Readable) {
      stream.on("data", (chunk: Buffer) => {
        size += chunk.length;
      });
    }

    this.objects.push({
      name,
      size,
    });
  }
  async getBlobSize(sha256: string): Promise<number> {
    const object = this.getBlobObject(sha256);
    if (!object) throw new Error("Object not found " + sha256);
    return object.size;
  }
  getBlobType(
    sha256: string,
  ): string | Promise<string | undefined> | undefined {
    const object = this.getBlobObject(sha256);
    if (!object) throw new Error("Missing blob");
    return mime.getType(object.name) ?? undefined;
  }
  readBlob(sha256: string): Promise<Readable> {
    const object = this.getBlobObject(sha256);
    if (!object) throw new Error("Object not found " + sha256);
    return this.client.getObject(this.bucket, object.name!);
  }
  async removeBlob(sha256: string): Promise<void> {
    const object = this.getBlobObject(sha256);
    if (!object) throw new Error("Object not found " + sha256);

    await this.client.removeObject(this.bucket, object.name!);
    this.objects.splice(this.objects.indexOf(object), 1);
  }
}
