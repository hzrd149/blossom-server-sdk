# blossom-server-sdk

A collection of classes to for building blossom servers

## Storage

all storage classes implement the `IBlobStorage` interface

```ts
interface IBlobStorage {
  setup(): Promise<void>;
  hasBlob(hash: string): Promise<boolean>;
  writeBlob(hash: string, stream: Readable, type?: string): Promise<void>;
  getBlobSize(sha256: string): Promise<number>;
  readBlob(hash: string): Promise<Readable>;
  removeBlob(hash: string): Promise<void>;
}
```

### Local Storage

A class that uses the built-in `fs` module in node to store blobs in the file system

```js
import LocalStorage from "blossom-server-sdk/storage/local";

const storage = new LocalStorage("./data");
await storage.setup();

const sha256 =
  "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553";

https.get(new URL(sha256, "https://cdn.satellite.earth"), async (res) => {
  const type = res.headers["content-type"];

  // write the blob to storage with the optional type
  await blobs.storage.writeBlob(sha256, res, type);
});
```

### S3 Storage

A storage class that uses `minio` to store blobs in a `s3` compatible API

```js
import S3Storage from "blossom-server-sdk/storage/s3";

const storage = new S3Storage("./data");
await storage.setup();

const sha256 =
  "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553";

https.get(new URL(sha256, "https://cdn.satellite.earth"), async (res) => {
  const type = res.headers["content-type"];

  // write the blob to s3 storage with the optional type
  await blobs.storage.writeBlob(sha256, res, type);
});
```