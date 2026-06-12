import { getDatabase } from './database';
import type { Product, ProductWithInventory } from '../types/database';

export async function getAllActiveProducts(): Promise<Product[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Product>(
    'SELECT id, name, category, unit, selling_price, cost_price, barcode, is_active, created_at FROM products WHERE is_active = 1 ORDER BY category, name'
  );
}

export async function getAllProductsWithInventory(): Promise<ProductWithInventory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<ProductWithInventory>(
    `SELECT p.id, p.name, p.category, p.unit, p.selling_price, p.cost_price,
            p.barcode, p.is_active, p.created_at,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.quantity END), 0) as shop_qty,
            COALESCE(MAX(CASE WHEN i.location = 'storage' THEN i.quantity END), 0) as storage_qty,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.low_stock_threshold END), 5) as low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.is_active = 1
     GROUP BY p.id
     ORDER BY p.category, p.name`
  );
}

export async function getProductsByLocation(location: 'shop' | 'storage'): Promise<ProductWithInventory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<ProductWithInventory>(
    `SELECT p.id, p.name, p.category, p.unit, p.selling_price, p.cost_price,
            p.barcode, p.is_active, p.created_at,
            COALESCE(i.quantity, 0) as shop_qty,
            COALESCE(i.quantity, 0) as storage_qty,
            COALESCE(i.low_stock_threshold, 5) as low_stock_threshold
     FROM products p
     INNER JOIN inventory i ON p.id = i.product_id AND i.location = ?
     WHERE p.is_active = 1
     ORDER BY p.category, p.name`,
    location
  );
}

export async function getProductById(id: number): Promise<ProductWithInventory | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProductWithInventory>(
    `SELECT p.id, p.name, p.category, p.unit, p.selling_price, p.cost_price,
            p.barcode, p.is_active, p.created_at,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.quantity END), 0) as shop_qty,
            COALESCE(MAX(CASE WHEN i.location = 'storage' THEN i.quantity END), 0) as storage_qty,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.low_stock_threshold END), 5) as low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.id = ?
     GROUP BY p.id`,
    id
  );
  return rows[0] ?? null;
}

export async function searchProducts(query: string): Promise<ProductWithInventory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<ProductWithInventory>(
    `SELECT p.id, p.name, p.category, p.unit, p.selling_price, p.cost_price,
            p.barcode, p.is_active, p.created_at,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.quantity END), 0) as shop_qty,
            COALESCE(MAX(CASE WHEN i.location = 'storage' THEN i.quantity END), 0) as storage_qty,
            COALESCE(MAX(CASE WHEN i.location = 'shop' THEN i.low_stock_threshold END), 5) as low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.is_active = 1 AND p.name LIKE ?
     GROUP BY p.id
     ORDER BY p.category, p.name`,
    `%${query}%`
  );
}

export async function createProduct(
  name: string,
  category: string,
  unit: string,
  selling_price: number,
  cost_price: number | null,
  initial_shop_qty: number,
  initial_storage_qty: number,
  low_stock_threshold: number
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO products (name, category, unit, selling_price, cost_price) VALUES (?, ?, ?, ?, ?)',
    name,
    category,
    unit,
    selling_price,
    cost_price
  );
  const productId = result.lastInsertRowId;

  if (initial_shop_qty > 0) {
    await db.runAsync(
      `INSERT INTO inventory (product_id, location, quantity, low_stock_threshold) VALUES (?, 'shop', ?, ?)`,
      productId,
      initial_shop_qty,
      low_stock_threshold
    );
  }
  if (initial_storage_qty > 0) {
    await db.runAsync(
      `INSERT INTO inventory (product_id, location, quantity, low_stock_threshold) VALUES (?, 'storage', ?, ?)`,
      productId,
      initial_storage_qty,
      low_stock_threshold
    );
  }
  return productId;
}

export async function updateProduct(
  id: number,
  name: string,
  category: string,
  unit: string,
  selling_price: number,
  cost_price: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE products SET name = ?, category = ?, unit = ?, selling_price = ?, cost_price = ? WHERE id = ?',
    name,
    category,
    unit,
    selling_price,
    cost_price,
    id
  );
}

export async function getMostSoldProducts(limit: number = 8): Promise<{ product_id: number; name: string; category: string; selling_price: number; unit: string }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT si.product_id, p.name, p.category, p.selling_price, p.unit,
            COUNT(*) as sale_count
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     GROUP BY si.product_id
     ORDER BY sale_count DESC
     LIMIT ?`,
    limit
  );
}

export async function searchProductsForSale(query: string): Promise<{ product_id: number; name: string; selling_price: number; unit: string; available_qty: number }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT p.id as product_id, p.name, p.selling_price, p.unit,
            COALESCE(i.quantity, 0) as available_qty
     FROM products p
     LEFT JOIN inventory i ON p.id = i.product_id AND i.location = 'shop'
     WHERE p.is_active = 1 AND p.name LIKE ?
     ORDER BY p.name
     LIMIT 20`,
    `%${query}%`
  );
}
