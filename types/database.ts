export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  selling_price: number;
  cost_price: number | null;
  barcode: string | null;
  is_active: number;
  created_at: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  location: 'storage' | 'shop';
  quantity: number;
  low_stock_threshold: number;
  last_updated: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  from_location: string | null;
  to_location: string | null;
  quantity: number;
  movement_type: 'received' | 'transfer' | 'sale' | 'adjustment' | 'waste';
  notes: string | null;
  created_at: string;
}

export interface Sale {
  id: number;
  sale_date: string;
  total_amount: number;
  payment_method: 'cash' | 'upi' | 'credit';
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product_name: string })[];
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface ProductWithInventory extends Product {
  shop_qty: number;
  storage_qty: number;
  low_stock_threshold: number;
}

export interface DailySummary {
  total_sales: number;
  transaction_count: number;
  average_transaction: number;
  cash_total: number;
  upi_total: number;
  credit_total: number;
  expense_total: number;
}

export interface WeeklyTrend {
  day_name: string;
  day_date: string;
  total: number;
}

export interface MonthlyOverview {
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  daily_trend: { date: string; amount: number }[];
  category_breakdown: { category: string; total: number }[];
  top_products: { product_name: string; total: number }[];
}

export interface ProductPerformance {
  product_id: number;
  product_name: string;
  category: string;
  units_sold: number;
  revenue: number;
  avg_daily_sales: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  available_qty: number;
  unit: string;
}
