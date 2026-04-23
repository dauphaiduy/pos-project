import { getDatabase } from '../db/database';
import type { Order, CreateOrderInput, OrderItem } from '@pos/shared-types';

function parseRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as number,
    total: row.total as number,
    status: row.status as string,
    payment_method: (row.payment_method as string) ?? 'cash',
    items: JSON.parse((row.items as string) || '[]') as OrderItem[],
    created_at: row.created_at as string,
  };
}

export function createOrder(input: CreateOrderInput): Order {
  const db = getDatabase();
  const info = db.prepare(
    `INSERT INTO orders (total, status, payment_method, items)
     VALUES (@total, @status, @payment_method, @items)`
  ).run({
    total: input.total,
    status: input.status ?? 'pending',
    payment_method: input.payment_method ?? 'cash',
    items: JSON.stringify(input.items ?? []),
  });
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(info.lastInsertRowid) as Record<string, unknown>;
  return parseRow(row);
}

export function listOrders(): Order[] {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(parseRow);
}

export function updateOrderStatus(id: number, status: string): Order {
  const db = getDatabase();
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as Record<string, unknown>;
  return parseRow(row);
}
