export type BlobMetadata = {
  uploaded: number;
  type?: string;
  sha256: string;
  size: number;
};

export interface IBlobMetadataStore {
  // blobs
  hasBlob(sha256: string): boolean | Promise<boolean>;
  getBlob(sha256: string): BlobMetadata | Promise<BlobMetadata>;
  addBlob(
    data: Omit<BlobMetadata, "url">,
  ): BlobMetadata | Promise<BlobMetadata>;
  removeBlob(sha256: string): boolean | Promise<boolean>;

  // blob owners
  hasOwner(sha256: string, pubkey: string): boolean | Promise<boolean>;
  addOwner(sha256: string, pubkey: string): boolean | Promise<boolean>;
  removeOwner(sha256: string, pubkey: string): boolean | Promise<boolean>;
  listOwners(sha256: string): string[] | Promise<string[]>
  getOwnerBlobs(pubkey: string): BlobMetadata[] | Promise<BlobMetadata[]>;
  getOrphanedBlobs(): BlobMetadata[] | Promise<BlobMetadata[]>;
}
