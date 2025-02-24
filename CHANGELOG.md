# blossom-server-sdk

## 0.8.0

### Minor Changes

- a9bab53: Update to use list objects V2 endpoint for S3 storage

## 0.7.3

### Patch Changes

- b11a806: Fix export paths

## 0.7.2

### Patch Changes

- Fix typescript bug

## 0.7.1

### Patch Changes

- Allow all minio options for S3Storage class

## 0.7.0

### Minor Changes

- Add options to S3Storage class

## 0.6.0

### Minor Changes

- Add `listBlobs` method to IBlobStorage interface and classes
- Upgrade to correct `minio` version `8.0.1`

## 0.5.0

### Minor Changes

- Add `listOwners` method to `IBlobMetadataStore` interface

## 0.4.0

### Minor Changes

- bump `better-sqlite3` to v11.1.2

### Patch Changes

- Remove `@changesets/cli` dependency

## 0.3.0

### Minor Changes

- Rename "created" field to "uploaded" on blobs
- Add support for "since" and "until" in `getAllBlobs` and `getOwnerBlobs` methods
