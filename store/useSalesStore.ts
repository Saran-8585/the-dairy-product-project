import { create } from 'zustand';
import type { CartItem, SaleWithItems } from '../types/database';
import * as SalesDB from '../db/sales';

interface SalesStore {
  cart: CartItem[];
  isProcessingSale: boolean;
  recentSales: SaleWithItems[];
  saleHistory: { date: string; sales: SaleWithItems[] }[];
  error: string | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQty: (productId: number, quantity: number) => void;
  clearCart: () => void;
  completeSale: (saleDate: string, paymentMethod: 'cash' | 'upi' | 'credit', notes: string | null) => Promise<number>;
  fetchRecentSales: () => Promise<void>;
  fetchSaleHistory: () => Promise<void>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  cart: [],
  isProcessingSale: false,
  recentSales: [],
  saleHistory: [],
  error: null,

  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find((i) => i.product_id === item.product_id);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unit_price }
            : i
        ),
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((i) => i.product_id !== productId) });
  },

  updateCartItemQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.product_id === productId ? { ...i, quantity, subtotal: quantity * i.unit_price } : i
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  completeSale: async (saleDate, paymentMethod, notes) => {
    set({ isProcessingSale: true, error: null });
    try {
      const { cart } = get();
      const saleId = await SalesDB.createSale(saleDate, paymentMethod, cart, notes);
      set({ cart: [], isProcessingSale: false });
      return saleId;
    } catch (err: any) {
      set({ error: err.message, isProcessingSale: false });
      throw err;
    }
  },

  fetchRecentSales: async () => {
    try {
      const sales = await SalesDB.getRecentSales(5);
      set({ recentSales: sales });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSaleHistory: async () => {
    try {
      const grouped = await SalesDB.getSalesGroupedByDate(50, 0);
      set({ saleHistory: grouped });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
