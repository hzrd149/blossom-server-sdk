import { Readable } from "stream";

export interface IBlobStorage {
  setup(): Promise<void>;
  hasBlob(hash: string): Promise<boolean>;
  writeBlob(hash: string, stream: Readable, type?: string): Promise<void>;
  getBlobSize(sha256: string): Promise<number>;
  readBlob(hash: string): Promise<Readable>;
  removeBlob(hash: string): Promise<void>;
}
