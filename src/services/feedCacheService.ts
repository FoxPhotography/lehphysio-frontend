const DB_NAME = 'LehPhysioFeedCacheDB';
const STORE_NAME = 'feed_cache';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

export interface CacheEntry {
  data: any;
  cachedAt: number;
}

export const feedCacheService = {
  async get(key: string): Promise<CacheEntry | null> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (err) {
      console.warn('IndexedDB read failed, falling back to localStorage:', err);
      try {
        const item = localStorage.getItem(`feed_cache_v2_${key}`);
        return item ? JSON.parse(item) : null;
      } catch (localErr) {
        console.error('localStorage fallback read failed:', localErr);
        return null;
      }
    }
  },

  async set(key: string, data: any): Promise<void> {
    const entry: CacheEntry = {
      data,
      cachedAt: Date.now()
    };
    try {
      const db = await getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(entry, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('IndexedDB write failed, falling back to localStorage:', err);
      try {
        localStorage.setItem(`feed_cache_v2_${key}`, JSON.stringify(entry));
      } catch (localErr) {
        console.error('localStorage fallback write failed:', localErr);
      }
    }
  },

  async clear(key: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('IndexedDB delete failed, falling back to localStorage:', err);
      try {
        localStorage.removeItem(`feed_cache_v2_${key}`);
      } catch (localErr) {
        console.error('localStorage fallback delete failed:', localErr);
      }
    }
  }
};
