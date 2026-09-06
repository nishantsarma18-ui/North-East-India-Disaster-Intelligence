import { IncidentReport } from '../types';

const DB_NAME = 'NEDisasterIntelligenceDB';
const DB_VERSION = 1;
const STORE_REPORTS = 'offlineReports';
const STORE_CACHE = 'intelligenceCache';

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_REPORTS)) {
          const reportStore = db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
          reportStore.createIndex('synced', 'synced', { unique: false });
          reportStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async saveReportLocally(report: IncidentReport): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readwrite');
      const store = tx.objectStore(STORE_REPORTS);
      const request = store.put(report);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLocalReports(): Promise<IncidentReport[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readonly');
      const store = tx.objectStore(STORE_REPORTS);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as IncidentReport[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedReports(): Promise<IncidentReport[]> {
    const reports = await this.getAllLocalReports();
    return reports.filter((r) => !r.synced);
  }

  async markReportsSynced(ids: string[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readwrite');
      const store = tx.objectStore(STORE_REPORTS);
      let count = 0;
      if (ids.length === 0) {
        resolve();
        return;
      }
      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = { ...getReq.result, synced: true };
            store.put(updated);
          }
          count++;
          if (count === ids.length) resolve();
        };
        getReq.onerror = () => reject(getReq.error);
      }
    });
  }

  async cacheIntelligence(key: string, data: unknown): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      const request = store.put({ key, data, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedIntelligence<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDb = new OfflineDatabase();
