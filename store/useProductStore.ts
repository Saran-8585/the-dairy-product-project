import { create } from 'zustand';
import type { ProductWithInventory, CartItem } from '../types/database';
import * as ProductDB from '../db/products';

interface ProductStore {
  products: ProductWithInventory[];
  shopProducts: ProductWithInventory[];
  storageProducts: ProductWithInventory[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchByLocation: (location: 'shop' | 'storage') => Promise<void>;
  addProduct: (
    name: string,
    category: string,
    unit: string,
    selling_price: number,
    cost_price: number | null,
    initial_shop_qty: number,
    initial_storage_qty: number,
    low_stock_threshold: number
  ) => Promise<void>;
  updateProduct: (id: number, name: string, category: string, unit: string, selling_price: number, cost_price: number | null) => Promise<void>;
  searchProducts: (query: string) => Promise<ProductWithInventory[]>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  shopProducts: [],
  storageProducts: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const products = await ProductDB.getAllProductsWithInventory();
      set({ products, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchByLocation: async (location) => {
    try {
      const products = await ProductDB.getProductsByLocation(location);
      if (location === 'shop') {
        set({ shopProducts: products });
      } else {
        set({ storageProducts: products });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addProduct: async (name, category, unit, selling_price, cost_price, initial_shop_qty, initial_storage_qty, low_stock_threshold) => {
    await ProductDB.createProduct(name, category, unit, selling_price, cost_price, initial_shop_qty, initial_storage_qty, low_stock_threshold);
    const products = await ProductDB.getAllProductsWithInventory();
    set({ products });
  },

  updateProduct: async (id, name, category, unit, selling_price, cost_price) => {
    await ProductDB.updateProduct(id, name, category, unit, selling_price, cost_price);
    const products = await ProductDB.getAllProductsWithInventory();
    set({ products });
  },

  searchProducts: async (query) => {
    return await ProductDB.searchProducts(query);
  },
}));
