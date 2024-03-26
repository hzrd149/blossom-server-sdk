import Database, { type Database as TDatabase } from "better-sqlite3";
import { BlobMetadata, IBlobMetadataStore } from "./interface.js";

export class BlossomSQLite implements IBlobMetadataStore {
  db: TDatabase;

  constructor(db: string | TDatabase) {
    this.db = typeof db === "string" ? new Database(db) : db;

    // Create blobs table
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS blobs (
					sha256 TEXT(64) PRIMARY KEY,
					type TEXT,
					size INTEGER NOT NULL,
					created INTEGER NOT NULL
				)`
      )
      .run();

    this.db
      .prepare("CREATE INDEX IF NOT EXISTS blobs_created ON blobs (created)")
      .run();

    // Create owners table
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS owners (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					blob TEXT(64) REFERENCES blobs(sha256),
					pubkey TEXT(64)
				)`
      )
      .run();

    this.db
      .prepare("CREATE INDEX IF NOT EXISTS owners_pubkey ON owners (pubkey)")
      .run();
  }

  hasBlob(sha256: string) {
    return !!this.db
      .prepare(`SELECT sha256 FROM blobs where sha256 = ?`)
      .get(sha256);
  }
  getBlob(sha256: string) {
    return this.db
      .prepare(`SELECT * FROM blobs where sha256 = ?`)
      .get(sha256) as BlobMetadata;
  }
  getAllBlobs(_opts?: { since?: number; until?: number }) {
    return this.db.prepare(`SELECT * FROM blobs`).all();
  }
  addBlob(blob: BlobMetadata) {
    this.db
      .prepare(
        `INSERT INTO blobs (sha256, size, type, created) VALUES (?, ?, ?, ?)`
      )
      .run(blob.sha256, blob.size, blob.type, blob.created);
    return blob;
  }
  addManyBlobs(blobs: BlobMetadata[]) {
    const insert = this.db.prepare(
      `INSERT INTO blobs (sha256, size, type, created) VALUES (?, ?, ?, ?)`
    );

    const many = this.db.transaction((arr: BlobMetadata[]) => {
      for (const blob of arr)
        insert.run(blob.sha256, blob.size, blob.type, blob.created);
    });

    many(blobs);
  }
  removeBlob(sha256: string) {
    // remove owners
    this.db.prepare("DELETE FROM owners WHERE blob = ?").run(sha256);
    // remove blobs
    const result = this.db
      .prepare("DELETE FROM blobs WHERE sha256 = ?")
      .run(sha256);
    return result.changes > 0;
  }

  hasOwner(sha256: string, pubkey: string) {
    return !!this.db
      .prepare(`SELECT * FROM owners where blob = ? AND pubkey = ?`)
      .get(sha256, pubkey);
  }
  getAllOwners() {
    return this.db.prepare(`SELECT * FROM owners`).all();
  }
  addOwner(sha256: string, pubkey: string) {
    if (!this.hasBlob(sha256)) return false;

    this.db
      .prepare(`INSERT INTO owners (blob, pubkey) VALUES (?, ?)`)
      .run(sha256, pubkey);
    return true;
  }
  removeOwner(sha256: string, pubkey: string) {
    const result = this.db
      .prepare("DELETE FROM owners WHERE blob = ? AND pubkey = ?")
      .run(sha256, pubkey);
    return result.changes > 0;
  }

  getOwnerBlobs(
    pubkey: string,
    _opts?: { since?: number; until?: number }
  ): BlobMetadata[] | Promise<BlobMetadata[]> {
    return this.db
      .prepare(
        `SELECT blobs.* FROM owners LEFT JOIN blobs ON blobs.sha256 = owners.blob WHERE owners.pubkey = ?`
      )
      .all(pubkey) as BlobMetadata[];
  }
  getOrphanedBlobs(): BlobMetadata[] | Promise<BlobMetadata[]> {
    return this.db
      .prepare(
        `SELECT blobs.* FROM blobs LEFT JOIN owners ON blobs.sha256 = owners.blob WHERE owners.pubkey IS NULL`
      )
      .all() as BlobMetadata[];
  }
}
