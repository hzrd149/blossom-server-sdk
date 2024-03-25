import { Client } from "minio";
import { type Readable } from "node:stream";
import mime from "mime";
import { logger } from "../logger.js";
import { IBlobStorage } from "./interface.js";

export class S3Storage implements IBlobStorage {
  log = logger.extend("storage:s3");
  client: Client;
  bucket: string;
  publicURL: string | undefined = undefined;

  objects: { name: string; size: number }[] = [];

  constructor(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    bucket: string
  ) {
    this.client = new Client({
      endPoint: endpoint,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    this.bucket = bucket;
  }

  private loadObjects() {
    return new Promise<void>(async (res) => {
      this.objects = [];
      const stream = await this.client.listObjects(this.bucket);
      stream.on("data", (object) => {
        if (object.name)
          this.objects.push({ name: object.name, size: object.size });
      });
      stream.on("end", () => res());
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
  async writeBlob(
    sha256: string,
    stream: Readable,
    type?: string | undefined
  ): Promise<void> {
    const name = this.createObjectName(sha256, type);
    let size = 0;
    await this.client.putObject(this.bucket, name, stream, {
      "x-amz-acl": "public-read",
      "Content-Type": type,
    });
    stream.on("data", (chunk: Buffer) => {
      size += chunk.length;
    });
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
    sha256: string
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
