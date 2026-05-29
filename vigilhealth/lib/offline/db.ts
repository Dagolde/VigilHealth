// IndexedDB schema for VigilHealth offline storage
// Stores: riskData, supplyLocations, syncQueue, userPreferences

export interface OfflineRiskData {
  id: string;
  locationKey: string; // "lat,lng" or city name
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  disease: string;
  source: 'who' | 'cdc' | 'community';
  cachedAt: number; // Unix timestamp
  validUntil: number; // Unix timestamp
}

export interface OfflineSupplyLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  availability: Record<string, 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'>;
  cachedAt: number;
}

export interface SyncQueueItem {
  id: string; // UUID
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  body: string; // JSON stringified
  createdAt: number;
  retryCount: number;
  tag: string; // e.g. 'help-request', 'supply-report', 'community-report'
}

export interface UserPreferences {
  key: string; // primary key
  value: unknown;
  updatedAt: number;
}

const DB_NAME = 'vigilhealth-offline';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function openOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Risk data store — keyed by locationKey
      if (!db.objectStoreNames.contains('riskData')) {
        const riskStore = db.createObjectStore('riskData', { keyPath: 'locationKey' });
        riskStore.createIndex('cachedAt', 'cachedAt');
        riskStore.createIndex('validUntil', 'validUntil');
      }

      // Supply locations store — keyed by id
      if (!db.objectStoreNames.contains('supplyLocations')) {
        const supplyStore = db.createObjectStore('supplyLocations', { keyPath: 'id' });
        supplyStore.createIndex('city', 'city');
        supplyStore.createIndex('cachedAt', 'cachedAt');
      }

      // Sync queue store — keyed by id
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('createdAt', 'createdAt');
        syncStore.createIndex('tag', 'tag');
      }

      // User preferences store — keyed by key
      if (!db.objectStoreNames.contains('userPreferences')) {
        db.createObjectStore('userPreferences', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };
  });
}

// ── Risk Data ──────────────────────────────────────────────

export async function cacheRiskData(data: OfflineRiskData): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('riskData', 'readwrite');
    tx.objectStore('riskData').put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedRiskData(locationKey: string): Promise<OfflineRiskData | null> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('riskData', 'readonly');
    const request = tx.objectStore('riskData').get(locationKey);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearExpiredRiskData(): Promise<void> {
  const db = await openOfflineDB();
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('riskData', 'readwrite');
    const store = tx.objectStore('riskData');
    const index = store.index('validUntil');
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Supply Locations ───────────────────────────────────────

export async function cacheSupplyLocations(locations: OfflineSupplyLocation[]): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('supplyLocations', 'readwrite');
    const store = tx.objectStore('supplyLocations');
    for (const loc of locations) store.put(loc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedSupplyLocations(city: string): Promise<OfflineSupplyLocation[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('supplyLocations', 'readonly');
    const index = tx.objectStore('supplyLocations').index('city');
    const request = index.getAll(city);
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

// ── Sync Queue ─────────────────────────────────────────────

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>
): Promise<string> {
  const db = await openOfflineDB();
  const id = crypto.randomUUID();
  const record: SyncQueueItem = {
    ...item,
    id,
    createdAt: Date.now(),
    retryCount: 0,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').add(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const request = tx.objectStore('syncQueue').getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function incrementSyncRetry(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result as SyncQueueItem | undefined;
      if (item) {
        item.retryCount += 1;
        store.put(item);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── User Preferences ───────────────────────────────────────

export async function setPreference(key: string, value: unknown): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('userPreferences', 'readwrite');
    tx.objectStore('userPreferences').put({ key, value, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPreference<T>(key: string): Promise<T | null> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('userPreferences', 'readonly');
    const request = tx.objectStore('userPreferences').get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}
