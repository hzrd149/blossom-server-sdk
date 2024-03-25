import { Readable } from "stream";

export interface IBlobStorage {
  /** setup storage */
  setup(): Promise<void>;
  /** check if blob exists in storage */
  hasBlob(sha256: string): Promise<boolean>;
  /** save blob */
  writeBlob(sha256: string, stream: Readable, type?: string): Promise<void>;
  /** get the size of the stored blob */
  getBlobSize(sha256: string): number | Promise<number>;
  /** get the MIME type of the blob if the storage knows it */
  getBlobType(sha256: string): string | undefined | Promise<string | undefined>;
  /** returns the blob contents as a Readable stream */
  readBlob(sha256: string): Promise<Readable>;
  /** remove a blob from storage */
  removeBlob(sha256: string): Promise<void>;
}
