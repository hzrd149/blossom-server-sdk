import path from "node:path";
import Database from "better-sqlite3";
import { BlossomSQLite } from "./sqlite.js";
import assert from "node:assert";

const db = new Database(path.join("data", "sqlite.db"));

const blobs = new BlossomSQLite(db);

if (
  !blobs.hasBlob(
    "b91dfd7565edb9382a5537b80bd5f24c6cbe9aee693abcdb7448098f1e8c608b"
  )
) {
  console.log("Add Blob 1");
  blobs.addBlob({
    sha256: "b91dfd7565edb9382a5537b80bd5f24c6cbe9aee693abcdb7448098f1e8c608b",
    created: 1710346822,
    size: 163148,
    type: "image/png",
  });
}

if (
  !blobs.hasBlob(
    "6ff9bc1c37c1e3e0a25cd79dc8a9cfecfa5c1132329d1a5b09389db3bee40124"
  )
) {
  console.log("Add Blob 2");
  blobs.addBlob({
    sha256: "6ff9bc1c37c1e3e0a25cd79dc8a9cfecfa5c1132329d1a5b09389db3bee40124",
    created: 1710940245,
    size: 10686,
    type: "image/gif",
  });
}

console.log("Add Owner");
blobs.addOwner(
  "6ff9bc1c37c1e3e0a25cd79dc8a9cfecfa5c1132329d1a5b09389db3bee40124",
  "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5"
);

console.log(
  "Has Owner 1",
  blobs.hasOwner(
    "b91dfd7565edb9382a5537b80bd5f24c6cbe9aee693abcdb7448098f1e8c608b",
    "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5"
  )
);
console.log(
  "Has Owner 2",
  blobs.hasOwner(
    "6ff9bc1c37c1e3e0a25cd79dc8a9cfecfa5c1132329d1a5b09389db3bee40124",
    "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5"
  )
);

console.log(
  "Owner Blobs",
  blobs.getOwnerBlobs(
    "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5"
  )
);

console.log("Remove Blob");
blobs.removeBlob(
  "6ff9bc1c37c1e3e0a25cd79dc8a9cfecfa5c1132329d1a5b09389db3bee40124"
);
console.log("Blobs", blobs.getAllBlobs());
console.log("Owners", blobs.getAllOwners());

const orphaned = await blobs.getOrphanedBlobs();
assert.equal(
  orphaned[0].sha256,
  "b91dfd7565edb9382a5537b80bd5f24c6cbe9aee693abcdb7448098f1e8c608b"
);
