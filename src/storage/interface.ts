import { Readable } from "stream";

export interface IBlobStorage {
  setup(): Promise<void>;
  hasBlob(sha256: string): Promise<boolean>;
  writeBlob(sha256: string, stream: Readable, type?: string): Promise<void>;
  getBlobSize(sha256: string): Promise<number>;
  readBlob(sha256: string): Promise<Readable>;
  removeBlob(sha256: string): Promise<void>;
}
