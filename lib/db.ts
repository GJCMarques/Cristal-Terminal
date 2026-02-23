import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

let db: Database | null = null;

export async function getDb() {
    if (!db) {
        db = await open({
            filename: './data/cristal.db',
            driver: sqlite3.Database
        });

        await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        passwordHash TEXT NOT NULL,
        nome TEXT NOT NULL,
        role TEXT NOT NULL,
        mfaEnabled BOOLEAN NOT NULL DEFAULT 0,
        mfaSecret TEXT
      );

      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }
    return db;
}
