import * as SecureStore from 'expo-secure-store';
import { getDatabase } from './database';

const FIRST_LAUNCH_KEY = 'is_first_launch_v1';

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  selling_price REAL NOT NULL,
  cost_price REAL,
  barcode TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  location TEXT NOT NULL CHECK(location IN ('storage', 'shop')),
  quantity REAL NOT NULL DEFAULT 0,
  low_stock_threshold REAL DEFAULT 5,
  last_updated TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  from_location TEXT,
  to_location TEXT,
  quantity REAL NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('received', 'transfer', 'sale', 'adjustment', 'waste')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'upi', 'credit')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
`;

const SEED_PRODUCTS = `
INSERT OR IGNORE INTO products (id, name, category, unit, selling_price, cost_price) VALUES
  (1, 'Full Fat Milk 500ml', 'Milk', 'litre', 32, 28),
  (2, 'Toned Milk 1L', 'Milk', 'litre', 56, 48),
  (3, 'Curd 200g', 'Curd', 'g', 25, 20),
  (4, 'Curd 500g', 'Curd', 'g', 55, 46),
  (5, 'Butter 100g', 'Butter', 'g', 48, 40),
  (6, 'Butter 500g', 'Butter', 'g', 230, 195),
  (7, 'Ghee 200ml', 'Ghee', 'ml', 180, 150),
  (8, 'Ghee 500ml', 'Ghee', 'ml', 420, 360),
  (9, 'Paneer 200g', 'Paneer', 'g', 60, 50),
  (10, 'Flavoured Milk 200ml', 'Milk', 'ml', 20, 16),
  (11, 'Lassi 200ml', 'Others', 'ml', 25, 20),
  (12, 'Buttermilk 200ml', 'Others', 'ml', 15, 12),
  (13, 'Cheese Slice Pack', 'Others', 'pack', 80, 68),
  (14, 'Cream 200ml', 'Others', 'ml', 45, 36),
  (15, 'Ice Cream Cup', 'Others', 'piece', 35, 28);
`;

const SEED_INVENTORY = `
INSERT OR IGNORE INTO inventory (product_id, location, quantity, low_stock_threshold) VALUES
  (1, 'shop', 12, 5),
  (1, 'storage', 48, 10),
  (2, 'shop', 10, 5),
  (2, 'storage', 36, 10),
  (3, 'shop', 20, 5),
  (3, 'storage', 60, 10),
  (4, 'shop', 15, 5),
  (4, 'storage', 40, 10),
  (5, 'shop', 18, 5),
  (5, 'storage', 50, 10),
  (6, 'shop', 8, 5),
  (6, 'storage', 24, 10),
  (7, 'shop', 10, 5),
  (7, 'storage', 30, 10),
  (8, 'shop', 6, 5),
  (8, 'storage', 18, 10),
  (9, 'shop', 14, 5),
  (9, 'storage', 36, 10),
  (10, 'shop', 25, 5),
  (10, 'storage', 72, 10),
  (11, 'shop', 20, 5),
  (11, 'storage', 48, 10),
  (12, 'shop', 30, 5),
  (12, 'storage', 60, 10),
  (13, 'shop', 10, 5),
  (13, 'storage', 24, 10),
  (14, 'shop', 12, 5),
  (14, 'storage', 36, 10),
  (15, 'shop', 20, 5),
  (15, 'storage', 48, 10);
`;

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(CREATE_TABLES);
  await db.execAsync(CREATE_INDEXES);

  const isFirstLaunch = await SecureStore.getItemAsync(FIRST_LAUNCH_KEY);
  if (!isFirstLaunch) {
    await db.execAsync(SEED_PRODUCTS);
    await db.execAsync(SEED_INVENTORY);
    await SecureStore.setItemAsync(FIRST_LAUNCH_KEY, 'true');
  }
}
