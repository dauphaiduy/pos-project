import { getDatabase } from '../db/database';
import type { Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

export function listProducts(): Product[] {
  const db = getDatabase();
  return db.prepare(`SELECT * FROM products ORDER BY category, name`).all() as Product[];
}

export function createProduct(input: CreateProductInput): Product {
  const db = getDatabase();
  const info = db.prepare(
    `INSERT INTO products (name, price, category, emoji, available)
     VALUES (@name, @price, @category, @emoji, @available)`
  ).run({
    name: input.name,
    price: input.price,
    category: input.category,
    emoji: input.emoji ?? '',
    available: input.available ?? 1,
  });
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(info.lastInsertRowid) as Product;
}

export function updateProduct(input: UpdateProductInput): Product {
  const db = getDatabase();
  const current = db.prepare(`SELECT * FROM products WHERE id = ?`).get(input.id) as Product | undefined;
  if (!current) throw new Error(`Product ${input.id} not found`);
  db.prepare(
    `UPDATE products SET
       name      = @name,
       price     = @price,
       category  = @category,
       emoji     = @emoji,
       available = @available
     WHERE id = @id`
  ).run({
    id: input.id,
    name:      input.name      ?? current.name,
    price:     input.price     ?? current.price,
    category:  input.category  ?? current.category,
    emoji:     input.emoji     ?? current.emoji,
    available: input.available ?? current.available,
  });
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(input.id) as Product;
}

export function deleteProduct(id: number): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
}
