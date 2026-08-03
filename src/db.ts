import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'webpackager';
const DB_VERSION = 2;
const PARTNER_ART_STORE = 'partnerArtHistory';
const PACK_DRAFT_STORE = 'packDraft';
const PACK_DRAFT_KEY = 'current';
const MAX_PARTNER_ART_HISTORY = 10;

export interface PartnerArtHistoryEntry {
  id: string;
  fileName: string;
  blob: Blob;
  hash: string;
  w: number;
  h: number;
  lastUsedAt: number;
}

export interface PackDraftSkin {
  name: string;
  type: 'custom' | 'customSlim';
  fileName: string;
  blob: Blob;
}

export interface PackDraftImage {
  fileName: string;
  blob: Blob;
  w: number;
  h: number;
}

export interface PackDraft {
  packName: string;
  packVersion: string;
  skins: PackDraftSkin[];
  storeImages: PackDraftImage[];
  keyArtHD: PackDraftImage | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PARTNER_ART_STORE)) {
        db.createObjectStore(PARTNER_ART_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PACK_DRAFT_STORE)) {
        db.createObjectStore(PACK_DRAFT_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(db: IDBDatabase, storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = run(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getPartnerArtHistory(): Promise<PartnerArtHistoryEntry[]> {
  const db = await openDb();
  const entries = await runTransaction(db, PARTNER_ART_STORE, 'readonly', (store) => store.getAll());
  return (entries as PartnerArtHistoryEntry[]).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export async function addPartnerArtToHistory(file: File, w: number, h: number): Promise<PartnerArtHistoryEntry> {
  const db = await openDb();
  const hash = await hashBlob(file);
  const existing = await getPartnerArtHistory();
  const match = existing.find((e) => e.hash === hash);

  const entry: PartnerArtHistoryEntry = match
    ? { ...match, lastUsedAt: Date.now() }
    : { id: uuidv4(), fileName: file.name, blob: file, hash, w, h, lastUsedAt: Date.now() };

  await runTransaction(db, PARTNER_ART_STORE, 'readwrite', (store) => store.put(entry));

  const all = await getPartnerArtHistory();
  const overflow = all.slice(MAX_PARTNER_ART_HISTORY);
  if (overflow.length > 0) {
    await Promise.all(overflow.map((e) => runTransaction(db, PARTNER_ART_STORE, 'readwrite', (store) => store.delete(e.id))));
  }

  return entry;
}

export async function touchPartnerArtHistory(id: string): Promise<PartnerArtHistoryEntry | undefined> {
  const db = await openDb();
  const existing = await getPartnerArtHistory();
  const entry = existing.find((e) => e.id === id);
  if (!entry) return undefined;

  const updated = { ...entry, lastUsedAt: Date.now() };
  await runTransaction(db, PARTNER_ART_STORE, 'readwrite', (store) => store.put(updated));
  return updated;
}

export async function removePartnerArtFromHistory(id: string): Promise<void> {
  const db = await openDb();
  await runTransaction(db, PARTNER_ART_STORE, 'readwrite', (store) => store.delete(id));
}

export async function savePackDraft(draft: PackDraft): Promise<void> {
  const db = await openDb();
  await runTransaction(db, PACK_DRAFT_STORE, 'readwrite', (store) => store.put({ id: PACK_DRAFT_KEY, ...draft }));
}

export async function loadPackDraft(): Promise<PackDraft | undefined> {
  const db = await openDb();
  const record = await runTransaction(db, PACK_DRAFT_STORE, 'readonly', (store) => store.get(PACK_DRAFT_KEY));
  return record as PackDraft | undefined;
}

export async function clearPackDraft(): Promise<void> {
  const db = await openDb();
  await runTransaction(db, PACK_DRAFT_STORE, 'readwrite', (store) => store.delete(PACK_DRAFT_KEY));
}
