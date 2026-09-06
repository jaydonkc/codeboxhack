import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { photoSize, photosForPlace, validatePhotoSelection, type PreparedPhoto } from "./photos";
import { deletePhotoRecord, deletePhotoRecords, openPhotoDatabase, readPhotoRecords, writePhotoRecords } from "../services/photoDatabase";

const asset = { uri: "file:///selected.jpg", width: 4032, height: 3024, mimeType: "image/jpeg", type: "image" };
const photo = (id: string, placeId = "sloma"): PreparedPhoto => ({ id, placeId, uri: "blob:temporary-preview", width: 1600, height: 1200, createdAt: 100 });
test("photo input limits reject oversized, unsupported, and excessive batches without rejecting cancellation", () => {
  assert.doesNotThrow(() => validatePhotoSelection([], 20));
  assert.doesNotThrow(() => validatePhotoSelection([asset], 19));
  assert.throws(() => validatePhotoSelection([asset], 20), /20 photos per place/);
  assert.throws(() => validatePhotoSelection(Array(7).fill(asset), 0), /6 photos/);
  assert.throws(() => validatePhotoSelection([{ ...asset, type: "video" }], 0), /Choose a photo/);
  assert.throws(() => validatePhotoSelection([{ ...asset, mimeType: "image/svg+xml" }], 0), /Choose a photo/);
  assert.throws(() => validatePhotoSelection([{ ...asset, fileSize: 51 * 1024 * 1024 }], 0), /50 MB/);
  assert.throws(() => validatePhotoSelection([{ ...asset, width: NaN }], 0), /could not be read/);
});
test("resizing preserves portrait/landscape aspect ratios and never enlarges small images", () => {
  assert.deepEqual(photoSize(4032, 3024), { width: 1600, height: 1200 });
  assert.deepEqual(photoSize(3024, 4032), { width: 1200, height: 1600 });
  assert.deepEqual(photoSize(640, 480), { width: 640, height: 480 });
});
test("photos persist across database reopening with the correct place and original image bytes", async () => {
  const factory = new IDBFactory();
  const first = await openPhotoDatabase(factory);
  await writePhotoRecords(first, [photo("one"), photo("two", "bishop-peak")], [new Blob(["image-one"], { type: "image/jpeg" }), new Blob(["image-two"], { type: "image/jpeg" })]);
  first.close();
  const reopened = await openPhotoDatabase(factory);
  const records = await readPhotoRecords(reopened);
  assert.equal(records.length, 2);
  assert.equal(await records.find(p => p.id === "one")!.blob.text(), "image-one");
  assert.equal("uri" in records[0], false, "temporary object URLs must not be persisted");
  assert.equal(photosForPlace(records.map(p => ({ ...p, uri: "new-session-uri" })), "sloma").length, 1);
  await deletePhotoRecord(reopened, "one");
  reopened.close();
  const third = await openPhotoDatabase(factory);
  assert.deepEqual((await readPhotoRecords(third)).map(p => p.id), ["two"]);
  third.close();
});
test("a failed photo batch rolls back every new image instead of partially saving", async () => {
  const db = await openPhotoDatabase(new IDBFactory());
  const blob = new Blob(["image"], { type: "image/jpeg" });
  await writePhotoRecords(db, [photo("existing")], [blob]);
  await assert.rejects(writePhotoRecords(db, [photo("new"), photo("existing")], [blob, blob]));
  assert.deepEqual((await readPhotoRecords(db)).map(p => p.id), ["existing"]);
  db.close();
});

test("deleting a custom place's photo batch persists while preserving other places", async () => {
  const factory = new IDBFactory();
  const db = await openPhotoDatabase(factory);
  const blob = new Blob(["image"]);
  await writePhotoRecords(db, [photo("one", "user:review"), photo("two", "user:review"), photo("keep")], [blob, blob, blob]);
  await deletePhotoRecords(db, ["one", "two"]);
  db.close();
  const reopened = await openPhotoDatabase(factory);
  assert.deepEqual((await readPhotoRecords(reopened)).map(p => p.id), ["keep"]);
  reopened.close();
});
