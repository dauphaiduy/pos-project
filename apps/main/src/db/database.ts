import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      total          INTEGER NOT NULL,
      status         TEXT    NOT NULL DEFAULT 'pending',
      payment_method TEXT    NOT NULL DEFAULT 'cash',
      items          TEXT    NOT NULL DEFAULT '[]',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      price      INTEGER NOT NULL,
      category   TEXT    NOT NULL DEFAULT 'Coffee',
      emoji      TEXT    NOT NULL DEFAULT '',
      available  INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Migrate older DBs that lack the new columns
  for (const col of [
    `ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'`,
    `ALTER TABLE orders ADD COLUMN items TEXT NOT NULL DEFAULT '[]'`,
  ]) {
    try { db.exec(col); } catch { /* column already exists */ }
  }
}
