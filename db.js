// IndexedDB helper module for data persistence
const DB_NAME = 'AviatorBankrollDB';
const DB_VERSION = 1;
const STORE_NAME = 'bankrollData';

class IndexedDBManager {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Save plan data to IndexedDB
     */
    async savePlanData(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const planData = {
                id: 'plan',
                ...data,
                lastUpdated: new Date().toISOString()
            };

            const request = store.put(planData);

            request.onsuccess = () => resolve(planData);
            request.onerror = () => reject(new Error('Failed to save plan data'));
        });
    }

    /**
     * Get plan data from IndexedDB
     */
    async getPlanData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('plan');

            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };

            request.onerror = () => reject(new Error('Failed to get plan data'));
        });
    }

    /**
     * Delete all data from IndexedDB
     */
    async deleteAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete data'));
        });
    }

    /**
     * Add daily entry to history
     */
    async addDailyEntry(entry) {
        const planData = await this.getPlanData();
        if (!planData) {
            throw new Error('No plan data found');
        }

        if (!planData.history) {
            planData.history = [];
        }

        planData.history.push({
            ...entry,
            timestamp: new Date().toISOString()
        });

        return this.savePlanData(planData);
    }

    /**
     * Update current capital
     */
    async updateCurrentCapital(newCapital) {
        const planData = await this.getPlanData();
        if (!planData) {
            throw new Error('No plan data found');
        }

        planData.currentCapital = newCapital;
        return this.savePlanData(planData);
    }
}

export default IndexedDBManager;
