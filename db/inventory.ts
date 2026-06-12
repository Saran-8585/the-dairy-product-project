import { getDatabase } from './database';
import type { Inventory, InventoryMovement } from '../types/database';

export async function getInventoryByProduct(productId: number): Promise<Inventory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Inventory>(
    'SELECT id, product_id, location, quantity, low_stock_threshold, last_updated FROM inventory WHERE product_id = ?',
    productId
  );
}

export async function getLowStockItems(location: 'shop' | 'storage' = 'shop'): Promise<{ product_id: number; product_name: string; quantity: number; threshold: number }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT i.product_id, p.name as product_name, i.quantity, i.low_stock_threshold as threshold
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE i.location = ? AND i.quantity < i.low_stock_threshold AND p.is_active = 1
     ORDER BY i.quantity ASC`,
    location
  );
}

export async function adjustStock(
  productId: number,
  location: 'shop' | 'storage',
  newQuantity: number,
  reason: string
): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getAllAsync<Inventory>(
    'SELECT id, quantity FROM inventory WHERE product_id = ? AND location = ?',
    productId,
    location
  );

  if (existing.length > 0) {
    const oldQty = existing[0]!.quantity;
    const diff = newQuantity - oldQty;
    await db.runAsync(
      "UPDATE inventory SET quantity = ?, last_updated = datetime('now') WHERE product_id = ? AND location = ?",
      newQuantity,
      productId,
      location
    );
    await db.runAsync(
      'INSERT INTO inventory_movements (product_id, from_location, to_location, quantity, movement_type, notes) VALUES (?, ?, NULL, ?, ?, ?)',
      productId,
      location,
      Math.abs(diff),
      'adjustment',
      reason
    );
  }
}

export async function transferStock(
  productId: number,
  quantity: number,
  notes: string | null
): Promise<void> {
  const db = await getDatabase();

  const shopInv = await db.getAllAsync<Inventory>(
    'SELECT id, quantity FROM inventory WHERE product_id = ? AND location = ?',
    productId,
    'shop'
  );
  const storageInv = await db.getAllAsync<Inventory>(
    'SELECT id, quantity FROM inventory WHERE product_id = ? AND location = ?',
    productId,
    'storage'
  );

  if (storageInv.length === 0 || (storageInv[0]?.quantity ?? 0) < quantity) {
    throw new Error('Not enough stock in storage');
  }

  const newStorageQty = (storageInv[0]?.quantity ?? 0) - quantity;
  const newShopQty = (shopInv[0]?.quantity ?? 0) + quantity;

  await db.runAsync(
    "UPDATE inventory SET quantity = ?, last_updated = datetime('now') WHERE product_id = ? AND location = 'storage'",
    newStorageQty,
    productId
  );

  if (shopInv.length > 0) {
    await db.runAsync(
      "UPDATE inventory SET quantity = ?, last_updated = datetime('now') WHERE product_id = ? AND location = 'shop'",
      newShopQty,
      productId
    );
  } else {
    await db.runAsync(
      "INSERT INTO inventory (product_id, location, quantity, low_stock_threshold) SELECT ?, 'shop', ?, COALESCE(low_stock_threshold, 5) FROM inventory WHERE product_id = ? AND location = 'storage'",
      productId,
      quantity,
      productId
    );
  }

  await db.runAsync(
    "INSERT INTO inventory_movements (product_id, from_location, to_location, quantity, movement_type, notes) VALUES (?, 'storage', 'shop', ?, 'transfer', ?)",
    productId,
    quantity,
    notes
  );
}

export async function receiveStock(
  productId: number,
  quantity: number,
  destination: 'storage' | 'shop',
  notes: string | null
): Promise<void> {
  const db = await getDatabase();

  const existing = await db.getAllAsync<Inventory>(
    'SELECT id, quantity FROM inventory WHERE product_id = ? AND location = ?',
    productId,
    destination
  );

  if (existing.length > 0) {
    const newQty = (existing[0]?.quantity ?? 0) + quantity;
    await db.runAsync(
      "UPDATE inventory SET quantity = ?, last_updated = datetime('now') WHERE product_id = ? AND location = ?",
      newQty,
      productId,
      destination
    );
  } else {
    await db.runAsync(
      'INSERT INTO inventory (product_id, location, quantity, low_stock_threshold) VALUES (?, ?, ?, 10)',
      productId,
      destination,
      quantity
    );
  }

  await db.runAsync(
    "INSERT INTO inventory_movements (product_id, from_location, to_location, quantity, movement_type, notes) VALUES (?, NULL, ?, ?, 'received', ?)",
    productId,
    destination,
    quantity,
    notes
  );
}

export async function getMovements(
  productId: number,
  limit: number = 20
): Promise<InventoryMovement[]> {
  const db = await getDatabase();
  return await db.getAllAsync<InventoryMovement>(
    'SELECT id, product_id, from_location, to_location, quantity, movement_type, notes, created_at FROM inventory_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?',
    productId,
    limit
  );
}
