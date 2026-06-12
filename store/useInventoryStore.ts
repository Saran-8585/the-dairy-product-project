import { create } from 'zustand';
import * as InventoryDB from '../db/inventory';
import * as ProductDB from '../db/products';
import type { InventoryMovement } from '../types/database';

interface InventoryStore {
  lowStockItems: { product_id: number; product_name: string; quantity: number; threshold: number }[];
  loading: boolean;
  error: string | null;
  fetchLowStock: () => Promise<void>;
  transferStock: (productId: number, quantity: number, notes: string | null) => Promise<void>;
  receiveStock: (productId: number, quantity: number, destination: 'storage' | 'shop', notes: string | null) => Promise<void>;
  adjustStock: (productId: number, location: 'shop' | 'storage', newQuantity: number, reason: string) => Promise<void>;
  getMovements: (productId: number, limit?: number) => Promise<InventoryMovement[]>;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  lowStockItems: [],
  loading: false,
  error: null,

  fetchLowStock: async () => {
    try {
      const items = await InventoryDB.getLowStockItems('shop');
      set({ lowStockItems: items });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  transferStock: async (productId, quantity, notes) => {
    await InventoryDB.transferStock(productId, quantity, notes);
  },

  receiveStock: async (productId, quantity, destination, notes) => {
    await InventoryDB.receiveStock(productId, quantity, destination, notes);
  },

  adjustStock: async (productId, location, newQuantity, reason) => {
    await InventoryDB.adjustStock(productId, location, newQuantity, reason);
  },

  getMovements: async (productId, limit) => {
    return await InventoryDB.getMovements(productId, limit);
  },
}));
