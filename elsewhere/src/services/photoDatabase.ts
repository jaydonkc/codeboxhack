import type { PreparedPhoto, SavedPhoto } from "../core/photos";

type RecordPhoto = Omit<SavedPhoto, "uri"> & { blob: Blob };
const DATABASE = "elsewhere-place-photos-v1";

// Keep image bytes out of localStorage. A batch commits both its metadata and
// image data in one IndexedDB transaction, including on quota failures.
export function openPhotoDatabase(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other Elsewhere tabs and try again."));
  });
}

function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Photos could not be saved."));
    transaction.onerror = () => {}; // The abort event reports the final result.
  });
}

export async function readPhotoRecords(db: IDBDatabase): Promise<RecordPhoto[]> {
  const tx = db.transaction("photos", "readonly");
  const finished = complete(tx);
  const request = tx.objectStore("photos").getAll();
  await finished;
  return request.result;
}

export async function writePhotoRecords(db: IDBDatabase, photos: PreparedPhoto[], blobs: Blob[]) {
  if (photos.length !== blobs.length) throw new Error("Photo data is incomplete.");
  const tx = db.transaction("photos", "readwrite");
  const finished = complete(tx);
  photos.forEach(({ uri, ...photo }, index) => tx.objectStore("photos").add({ ...photo, blob: blobs[index] }));
  await finished;
}

export async function deletePhotoRecord(db: IDBDatabase, id: string) {
  return deletePhotoRecords(db, [id]);
}

export async function deletePhotoRecords(db: IDBDatabase, ids: string[]) {
  const tx = db.transaction("photos", "readwrite");
  const finished = complete(tx);
  ids.forEach(id => tx.objectStore("photos").delete(id));
  await finished;
}
