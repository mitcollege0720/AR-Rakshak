// Robust Offline Storage Layer (IndexedDB with LocalStorage Fallback)

const StorageLayer = {
  dbName: "AR_RAKSHAK_STORAGE",
  dbVersion: 1,
  db: null,

  async init() {
    if (!window.indexedDB) {
      console.warn("IndexedDB not supported, falling back to localStorage");
      return;
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, this.dbVersion);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("sync_queue")) {
            db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
          }
          if (!db.objectStoreNames.contains("cache")) {
            db.createObjectStore("cache", { keyPath: "key" });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        req.onerror = (e) => {
          console.warn("IndexedDB open failed, using localStorage fallback", e);
          resolve(null);
        };
      } catch (err) {
        console.warn("IndexedDB exception, using localStorage fallback", err);
        resolve(null);
      }
    });
  },

  async enqueueSync(type, payload) {
    const item = {
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction("sync_queue", "readwrite");
          const store = tx.objectStore("sync_queue");
          const req = store.add(item);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            this.enqueueLocalStorage(item);
            resolve(null);
          };
        } catch (e) {
          this.enqueueLocalStorage(item);
          resolve(null);
        }
      });
    } else {
      this.enqueueLocalStorage(item);
      return Promise.resolve(null);
    }
  },

  enqueueLocalStorage(item) {
    try {
      const queue = JSON.parse(localStorage.getItem("arr_sync_queue") || "[]");
      item.id = "ls_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      queue.push(item);
      localStorage.setItem("arr_sync_queue", JSON.stringify(queue));
    } catch (e) {
      console.error("Storage full or unavailable", e);
    }
  },

  async getPendingSyncs() {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction("sync_queue", "readonly");
          const store = tx.objectStore("sync_queue");
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getLocalStorageSyncs());
        } catch (e) {
          resolve(this.getLocalStorageSyncs());
        }
      });
    }
    return Promise.resolve(this.getLocalStorageSyncs());
  },

  getLocalStorageSyncs() {
    try {
      return JSON.parse(localStorage.getItem("arr_sync_queue") || "[]");
    } catch (e) {
      return [];
    }
  },

  async removeSyncItem(id) {
    if (this.db && typeof id === "number") {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction("sync_queue", "readwrite");
          const store = tx.objectStore("sync_queue");
          const req = store.delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    } else {
      try {
        const queue = JSON.parse(localStorage.getItem("arr_sync_queue") || "[]");
        const filtered = queue.filter(item => item.id !== id);
        localStorage.setItem("arr_sync_queue", JSON.stringify(filtered));
        return Promise.resolve(true);
      } catch (e) {
        return Promise.resolve(false);
      }
    }
  },

  async setCache(key, value) {
    try {
      localStorage.setItem("arr_cache_" + key, JSON.stringify(value));
    } catch (e) {
      console.warn("Local storage cache write failed", e);
    }
  },

  getCache(key) {
    try {
      const item = localStorage.getItem("arr_cache_" + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }
};
