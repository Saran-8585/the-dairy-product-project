import { getDatabase, withTransaction } from './database';
import type { Sale, SaleItem, SaleWithItems, CartItem } from '../types/database';

export async function createSale(
  saleDate: string,
  paymentMethod: 'cash' | 'upi' | 'credit',
  items: CartItem[],
  notes: string | null
): Promise<number> {
  return await withTransaction(async (db) => {
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const saleResult = await db.runAsync(
      'INSERT INTO sales (sale_date, total_amount, payment_method, notes) VALUES (?, ?, ?, ?)',
      saleDate,
      totalAmount,
      paymentMethod,
      notes
    );
    const saleId = saleResult.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        saleId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.subtotal
      );

      await db.runAsync(
        `UPDATE inventory SET quantity = quantity - ?, last_updated = datetime('now')
         WHERE product_id = ? AND location = 'shop'`,
        item.quantity,
        item.product_id
      );

      await db.runAsync(
        "INSERT INTO inventory_movements (product_id, from_location, to_location, quantity, movement_type, notes) VALUES (?, 'shop', NULL, ?, 'sale', NULL)",
        item.product_id,
        item.quantity
      );
    }

    return saleId;
  });
}

export async function getSalesByDate(date: string): Promise<SaleWithItems[]> {
  const db = await getDatabase();
  const sales = await db.getAllAsync<Sale>(
    'SELECT id, sale_date, total_amount, payment_method, notes, created_at FROM sales WHERE sale_date = ? ORDER BY created_at DESC',
    date
  );

  const result: SaleWithItems[] = [];
  for (const sale of sales) {
    const items = await db.getAllAsync<SaleItem & { product_name: string }>(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.subtotal, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      sale.id
    );
    result.push({ ...sale, items });
  }
  return result;
}

export async function getSalesGroupedByDate(
  limit: number = 50,
  offset: number = 0
): Promise<{ date: string; sales: SaleWithItems[] }[]> {
  const db = await getDatabase();
  const sales = await db.getAllAsync<Sale>(
    'SELECT id, sale_date, total_amount, payment_method, notes, created_at FROM sales ORDER BY sale_date DESC, created_at DESC LIMIT ? OFFSET ?',
    limit,
    offset
  );

  const grouped: Record<string, SaleWithItems[]> = {};
  for (const sale of sales) {
    const items = await db.getAllAsync<SaleItem & { product_name: string }>(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.subtotal, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      sale.id
    );
    const key = sale.sale_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ ...sale, items });
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sales]) => ({ date, sales }));
}

export async function getRecentSales(limit: number = 5): Promise<SaleWithItems[]> {
  const db = await getDatabase();
  const sales = await db.getAllAsync<Sale>(
    'SELECT id, sale_date, total_amount, payment_method, notes, created_at FROM sales ORDER BY created_at DESC LIMIT ?',
    limit
  );

  const result: SaleWithItems[] = [];
  for (const sale of sales) {
    const items = await db.getAllAsync<SaleItem & { product_name: string }>(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.subtotal, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      sale.id
    );
    result.push({ ...sale, items });
  }
  return result;
}

export async function getTodaySummary(): Promise<{
  total_amount: number;
  transaction_count: number;
}> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0] ?? '';
  const result = await db.getAllAsync<{ total_amount: number; transaction_count: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) as total_amount, COUNT(*) as transaction_count
     FROM sales WHERE sale_date = ?`,
    today
  );
  return result[0] ?? { total_amount: 0, transaction_count: 0 };
}

export async function getSalesByDateRange(
  startDate: string,
  endDate: string
): Promise<SaleWithItems[]> {
  const db = await getDatabase();
  const sales = await db.getAllAsync<Sale>(
    'SELECT id, sale_date, total_amount, payment_method, notes, created_at FROM sales WHERE sale_date >= ? AND sale_date <= ? ORDER BY created_at DESC',
    startDate,
    endDate
  );

  const result: SaleWithItems[] = [];
  for (const sale of sales) {
    const items = await db.getAllAsync<SaleItem & { product_name: string }>(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.subtotal, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      sale.id
    );
    result.push({ ...sale, items });
  }
  return result;
}
