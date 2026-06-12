import { getDatabase } from './database';
import type { DailySummary, WeeklyTrend, MonthlyOverview, ProductPerformance } from '../types/database';

export async function getDailySummaryReport(date: string): Promise<DailySummary> {
  const db = await getDatabase();
  const result = await db.getAllAsync<DailySummary>(
    `SELECT
       COALESCE(SUM(s.total_amount), 0) as total_sales,
       COUNT(s.id) as transaction_count,
       COALESCE(ROUND(AVG(s.total_amount), 2), 0) as average_transaction,
       COALESCE(SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount END), 0) as cash_total,
       COALESCE(SUM(CASE WHEN s.payment_method = 'upi' THEN s.total_amount END), 0) as upi_total,
       COALESCE(SUM(CASE WHEN s.payment_method = 'credit' THEN s.total_amount END), 0) as credit_total,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date = ?), 0) as expense_total
     FROM sales s
     WHERE s.sale_date = ?`,
    date,
    date
  );
  return result[0] ?? {
    total_sales: 0,
    transaction_count: 0,
    average_transaction: 0,
    cash_total: 0,
    upi_total: 0,
    credit_total: 0,
    expense_total: 0,
  };
}

export async function getTopProducts(date: string, limit: number = 5): Promise<{ product_name: string; total: number }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT p.name as product_name, SUM(si.subtotal) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id
     WHERE s.sale_date = ?
     GROUP BY si.product_id
     ORDER BY total DESC
     LIMIT ?`,
    date,
    limit
  );
}

export async function getWeeklyTrend(
  weekStart: string,
  weekEnd: string
): Promise<WeeklyTrend[]> {
  const db = await getDatabase();
  return await db.getAllAsync<WeeklyTrend>(
    `SELECT strftime('%w', sale_date) as day_num,
            sale_date as day_date,
            COALESCE(SUM(total_amount), 0) as total
     FROM sales
     WHERE sale_date >= ? AND sale_date <= ?
     GROUP BY sale_date
     ORDER BY sale_date`,
    weekStart,
    weekEnd
  );
}

export async function getMonthlyOverview(
  year: number,
  month: number
): Promise<MonthlyOverview> {
  const db = await getDatabase();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const startDate = `${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const summary = await db.getAllAsync<{ total_revenue: number; total_expenses: number }>(
    `SELECT
       COALESCE((SELECT SUM(total_amount) FROM sales WHERE sale_date >= ? AND sale_date <= ?), 0) as total_revenue,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date >= ? AND expense_date <= ?), 0) as total_expenses`,
    startDate,
    endDate,
    startDate,
    endDate
  );

  const dailyTrend = await db.getAllAsync<{ date: string; amount: number }>(
    `SELECT sale_date as date, COALESCE(SUM(total_amount), 0) as amount
     FROM sales WHERE sale_date >= ? AND sale_date <= ?
     GROUP BY sale_date ORDER BY sale_date`,
    startDate,
    endDate
  );

  const categoryBreakdown = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT p.category, COALESCE(SUM(si.subtotal), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id
     WHERE s.sale_date >= ? AND s.sale_date <= ?
     GROUP BY p.category
     ORDER BY total DESC`,
    startDate,
    endDate
  );

  const topProducts = await db.getAllAsync<{ product_name: string; total: number }>(
    `SELECT p.name as product_name, COALESCE(SUM(si.subtotal), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id
     WHERE s.sale_date >= ? AND s.sale_date <= ?
     GROUP BY si.product_id
     ORDER BY total DESC
     LIMIT 10`,
    startDate,
    endDate
  );

  return {
    total_revenue: summary[0]?.total_revenue ?? 0,
    total_expenses: summary[0]?.total_expenses ?? 0,
    gross_profit: (summary[0]?.total_revenue ?? 0) - (summary[0]?.total_expenses ?? 0),
    daily_trend: dailyTrend,
    category_breakdown: categoryBreakdown,
    top_products: topProducts,
  };
}

export async function getProductPerformance(
  startDate: string,
  endDate: string,
  category: string | null = null
): Promise<ProductPerformance[]> {
  const db = await getDatabase();
  const dateRangeDays = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  let query = `
    SELECT p.id as product_id, p.name as product_name, p.category,
           COALESCE(SUM(si.quantity), 0) as units_sold,
           COALESCE(SUM(si.subtotal), 0) as revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.sale_date >= ? AND s.sale_date <= ?
  `;
  const params: (string | number)[] = [startDate, endDate];

  if (category && category !== 'All') {
    query += ' AND p.category = ?';
    params.push(category);
  }

  query += ' GROUP BY si.product_id ORDER BY revenue DESC';

  const results = await db.getAllAsync<any>(query, params);
  return results.map((r: any) => ({
    ...r,
    avg_daily_sales: dateRangeDays > 0 ? Math.round((r.revenue / dateRangeDays) * 100) / 100 : 0,
  }));
}

export async function getDashboardStats(): Promise<{
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  shopProductCount: number;
  storageProductCount: number;
}> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0] ?? '';

  const todayData = await db.getAllAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE sale_date = ?`,
    today
  );

  const lowStock = await db.getAllAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM inventory WHERE location = 'shop' AND quantity < low_stock_threshold`
  );

  const shopProducts = await db.getAllAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM inventory WHERE location = 'shop' AND quantity > 0`
  );

  const storageProducts = await db.getAllAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM inventory WHERE location = 'storage' AND quantity > 0`
  );

  return {
    todaySales: todayData[0]?.total ?? 0,
    todayTransactions: todayData[0]?.count ?? 0,
    lowStockCount: lowStock[0]?.cnt ?? 0,
    shopProductCount: shopProducts[0]?.cnt ?? 0,
    storageProductCount: storageProducts[0]?.cnt ?? 0,
  };
}

export async function getWeekComparison(
  weekStart: string,
  weekEnd: string,
  prevWeekStart: string,
  prevWeekEnd: string
): Promise<{ thisWeek: number; lastWeek: number; changePercent: number }> {
  const db = await getDatabase();
  const thisWeek = await db.getAllAsync<{ total: number }>(
    'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date >= ? AND sale_date <= ?',
    weekStart,
    weekEnd
  );
  const lastWeek = await db.getAllAsync<{ total: number }>(
    'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date >= ? AND sale_date <= ?',
    prevWeekStart,
    prevWeekEnd
  );

  const thisWeekTotal = thisWeek[0]?.total ?? 0;
  const lastWeekTotal = lastWeek[0]?.total ?? 0;
  const changePercent = lastWeekTotal > 0
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : thisWeekTotal > 0 ? 100 : 0;

  return { thisWeek: thisWeekTotal, lastWeek: lastWeekTotal, changePercent };
}
