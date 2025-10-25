interface Order {
  orderHash: string;
  maker: string;
  taker: string;
  makerAssetId: string;
  takerAssetId: string;
  makerAmountFilled: string;
  takerAmountFilled: string;
  fee: string;
  blockNumber: number;
  timestamp: number;
  side: 'BUY' | 'SELL';
  price: number;
  volumeUsd: number;
}

interface WhaleActivity extends Order {}

interface DataStore {
  orders: Order[];
  whales: WhaleActivity[];
  lastUpdate: number;
  blockHeight: number;
}

// Global data store that persists between requests
const store: DataStore = {
  orders: [],
  whales: [],
  lastUpdate: Date.now(),
  blockHeight: 0,
};

export const dataStore = {
  getOrders: (limit: number = 10, marketId?: string): Order[] => {
    let filteredOrders = store.orders;
    if (marketId) {
      filteredOrders = filteredOrders.filter(order => 
        order.makerAssetId === marketId || order.takerAssetId === marketId
      );
    }
    // Sort by timestamp (latest first) and limit
    return filteredOrders
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
  
  getWhales: (): WhaleActivity[] => {
    // Sort by timestamp (latest first)
    return store.whales
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  },
  
  setOrders: (newOrders: Order[], blockHeight: number) => {
    // Add new orders to existing ones (avoid duplicates)
    const existingHashes = new Set(store.orders.map(o => o.orderHash));
    const uniqueNewOrders = newOrders.filter(order => !existingHashes.has(order.orderHash));
    
    // Add new orders to the beginning
    store.orders = [...uniqueNewOrders, ...store.orders];
    
    // Keep only latest 50 orders to prevent memory issues
    store.orders = store.orders
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    
    store.lastUpdate = Date.now();
    store.blockHeight = blockHeight;
  },
  
  updateOrders: (newOrders: Order[], blockHeight: number) => {
    // Add new orders to existing ones (avoid duplicates)
    const existingHashes = new Set(store.orders.map(o => o.orderHash));
    const uniqueNewOrders = newOrders.filter(order => !existingHashes.has(order.orderHash));
    
    // Add new orders to the beginning
    store.orders = [...uniqueNewOrders, ...store.orders];
    
    // Keep only latest 50 orders to prevent memory issues
    store.orders = store.orders
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    
    store.lastUpdate = Date.now();
    store.blockHeight = blockHeight;
  },
  
  addWhales: (newWhales: WhaleActivity[]) => {
    const existingHashes = new Set(store.whales.map(w => w.orderHash));
    const uniqueNewWhales = newWhales.filter(w => !existingHashes.has(w.orderHash));
    store.whales.push(...uniqueNewWhales);
    
    // Keep only latest 100 whales
    store.whales = store.whales
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
    
    store.lastUpdate = Date.now();
  },
  
  getLastUpdate: () => store.lastUpdate,
  getBlockHeight: () => store.blockHeight,
  
  // Clear old orders (older than 1 hour)
  clearOldOrders: () => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    store.orders = store.orders.filter(order => order.timestamp > oneHourAgo);
    store.whales = store.whales.filter(whale => whale.timestamp > oneHourAgo);
  }
};

// Export individual functions for easier importing
export const { getOrders, getWhales, setOrders, updateOrders, addWhales, getLastUpdate, getBlockHeight, clearOldOrders } = dataStore;