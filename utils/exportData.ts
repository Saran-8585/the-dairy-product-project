import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../db/database';
import { format, parseISO } from 'date-fns';

export async function exportBackup(): Promise<string> {
  const db = await getDatabase();

  const products = await db.getAllAsync('SELECT * FROM products');
  const inventory = await db.getAllAsync('SELECT * FROM inventory');
  const movements = await db.getAllAsync('SELECT * FROM inventory_movements');
  const sales = await db.getAllAsync('SELECT * FROM sales');
  const saleItems = await db.getAllAsync('SELECT * FROM sale_items');
  const expenses = await db.getAllAsync('SELECT * FROM expenses');

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { products, inventory, movements, sales, saleItems, expenses },
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `arokya_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
  const filePath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, json);
  return filePath;
}

export async function restoreBackup(fileUri: string): Promise<void> {
  const db = await getDatabase();
  const json = await FileSystem.readAsStringAsync(fileUri);
  const backup = JSON.parse(json);

  if (!backup.schemaVersion || backup.schemaVersion < 1) {
    throw new Error('Incompatible backup format');
  }

  await db.execAsync('BEGIN;');
  try {
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM sales;');
    await db.execAsync('DELETE FROM inventory_movements;');
    await db.execAsync('DELETE FROM inventory;');
    await db.execAsync('DELETE FROM expenses;');
    await db.execAsync('DELETE FROM products;');

    const { products, inventory, movements, sales, saleItems, expenses } = backup.data;
    for (const p of products) {
      await db.runAsync(
        'INSERT INTO products (id, name, category, unit, selling_price, cost_price, barcode, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.id, p.name, p.category, p.unit, p.selling_price, p.cost_price, p.barcode, p.is_active, p.created_at
      );
    }
    for (const i of inventory) {
      await db.runAsync(
        'INSERT INTO inventory (id, product_id, location, quantity, low_stock_threshold, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
        i.id, i.product_id, i.location, i.quantity, i.low_stock_threshold, i.last_updated
      );
    }
    for (const m of movements) {
      await db.runAsync(
        'INSERT INTO inventory_movements (id, product_id, from_location, to_location, quantity, movement_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        m.id, m.product_id, m.from_location, m.to_location, m.quantity, m.movement_type, m.notes, m.created_at
      );
    }
    for (const s of sales) {
      await db.runAsync(
        'INSERT INTO sales (id, sale_date, total_amount, payment_method, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        s.id, s.sale_date, s.total_amount, s.payment_method, s.notes, s.created_at
      );
    }
    for (const si of saleItems) {
      await db.runAsync(
        'INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.subtotal
      );
    }
    for (const e of expenses) {
      await db.runAsync(
        'INSERT INTO expenses (id, expense_date, category, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        e.id, e.expense_date, e.category, e.amount, e.description, e.created_at
      );
    }

    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function shareText(text: string): Promise<void> {
  const filename = `arokya_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, text);
  await Sharing.shareAsync(filePath, { mimeType: 'text/plain' });
}

export async function shareFile(filePath: string): Promise<void> {
  await Sharing.shareAsync(filePath, { mimeType: 'application/json' });
}

export function generateSalesText(sales: any[]): string {
  let text = '=== Arokya Shop Manager - Sales Report ===\n\n';
  for (const sale of sales) {
    text += `Date: ${sale.sale_date}\n`;
    text += `Time: ${sale.created_at ? format(parseISO(sale.created_at), 'hh:mm a') : '-'}\n`;
    text += `Payment: ${sale.payment_method.toUpperCase()}\n`;
    text += `Total: ₹${sale.total_amount.toFixed(2)}\n`;
    text += `Items:\n`;
    for (const item of sale.items) {
      text += `  - ${item.product_name} x ${item.quantity} @ ₹${item.unit_price} = ₹${item.subtotal.toFixed(2)}\n`;
    }
    text += '---\n\n';
  }
  return text;
}

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('BEGIN;');
  try {
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM sales;');
    await db.execAsync('DELETE FROM inventory_movements;');
    await db.execAsync('DELETE FROM inventory;');
    await db.execAsync('DELETE FROM expenses;');
    await db.execAsync('DELETE FROM products;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
