import dayjs from 'dayjs';

// 数据库配置
const DB_NAME = 'NoSmokingDB';
const DB_VERSION = 1;

// 对象仓库名称
export const STORE_CIGARETTES = 'cigarettes';
export const STORE_RECORDS = 'records';

// 记录类型
export enum RecordType {
  SMOKE = 'smoke',    // 抽烟
  SHARE = 'share',    // 分烟
}

// 香烟接口
export interface Cigarette {
  id?: number;
  name: string;
  price: number;
  packSize: number; // 一包的数量
  createdAt: number;
  updatedAt: number;
}

// 记录接口
export interface Record {
  id?: number;
  cigaretteId: number;
  cigaretteName: string;
  type: RecordType;
  price?: number;
  timestamp: number;
  createdAt: number;
}

class IndexedDB {
  private db: IDBDatabase | null = null;

  // 打开数据库
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建香烟对象仓库
        if (!db.objectStoreNames.contains(STORE_CIGARETTES)) {
          const cigaretteStore = db.createObjectStore(STORE_CIGARETTES, {
            keyPath: 'id',
            autoIncrement: true
          });
          cigaretteStore.createIndex('name', 'name', { unique: false });
          cigaretteStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建记录对象仓库
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const recordStore = db.createObjectStore(STORE_RECORDS, {
            keyPath: 'id',
            autoIncrement: true
          });
          recordStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordStore.createIndex('type', 'type', { unique: false });
          recordStore.createIndex('cigaretteId', 'cigaretteId', { unique: false });
        }
      };
    });
  }

  // 获取数据库实例
  async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    return await this.open();
  }

  // 添加数据
  async add(storeName: string, data: any): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  // 获取所有数据
  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 根据ID获取数据
  async get(storeName: string, id: number): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 更新数据
  async update(storeName: string, data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 删除数据
  async delete(storeName: string, id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 根据索引查询数据
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 获取最新记录
  async getLatestRecord(): Promise<Record | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(null);
        }
      };
    });
  }

  // 获取今日记录
  async getTodayRecords(): Promise<Record[]> {
    const today = dayjs().startOf('day').valueOf();
    const tomorrow = dayjs().endOf('day').valueOf();
    
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(today, tomorrow);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 获取指定日期范围的记录
  async getRecordsByDateRange(startDate: number, endDate: number): Promise<Record[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const db = new IndexedDB();
