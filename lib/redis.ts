// ============================================================
// CRISTAL CAPITAL TERMINAL — Emulador de Redis (SQLite Local)
// Substituto do Upstash Redis usando Base de Dados local
// ============================================================
import { getDb } from './db'

export const redis = {
  get: async (key: string) => {
    const db = await getDb()
    const row = await db.get('SELECT value FROM kv WHERE key = ?', key)
    return row ? JSON.parse(row.value) : null
  },

  set: async (key: string, value: any) => {
    const db = await getDb()
    await db.run('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, JSON.stringify(value))
    return 'OK'
  },

  llen: async (key: string) => {
    const db = await getDb()
    const row = await db.get('SELECT COUNT(*) as c FROM lists WHERE key = ?', key)
    return row ? row.c : 0
  },

  lrange: async (key: string, start: number, end: number) => {
    const db = await getDb()
    // Retorna todos pela ordem de inserção do autoincrement
    const rows = await db.all('SELECT value FROM lists WHERE key = ? ORDER BY id ASC', key)
    const arr = rows.map(r => r.value)

    // Suporte aos indíces negativos do Redis
    if (end === -1 || end >= arr.length) end = arr.length - 1
    if (start < 0) start = arr.length + start

    return arr.slice(start, end + 1)
  },

  rpush: async (key: string, ...values: any[]) => {
    const db = await getDb()
    for (const val of values) {
      await db.run(
        'INSERT INTO lists (key, value) VALUES (?, ?)',
        key,
        typeof val === 'string' ? val : JSON.stringify(val)
      )
    }
  },

  // Funções vazias para não quebrar módulos onde o código já nem chama (ex: mfa, etc)
  hgetall: async () => null,
  hset: async () => { },
  sadd: async () => { },
  sismember: async () => false,
  del: async (key: string) => {
    const db = await getDb()
    await db.run('DELETE FROM kv WHERE key = ?', key)
    await db.run('DELETE FROM lists WHERE key = ?', key)
    await db.run('DELETE FROM zsets WHERE key = ?', key)
    return 1
  },
  ltrim: async () => { },
  expire: async () => { },

  // Sorted sets (usados pela Presença no Chat)
  zadd: async (key: string, obj: { score: number, member: string }) => {
    const db = await getDb()
    await db.run(
      'INSERT INTO zsets (key, member, score) VALUES (?, ?, ?) ON CONFLICT(key, member) DO UPDATE SET score=excluded.score',
      key, obj.member, obj.score
    )
  },
  zrange: async (key: string, min: string | number, max: string | number, opts?: any) => {
    const db = await getDb()
    let query = 'SELECT member FROM zsets WHERE key = ?'
    const params: any[] = [key]

    if (opts?.byScore) {
      if (min !== '-inf') {
        query += ' AND score >= ?'
        params.push(min)
      }
      if (max !== '+inf') {
        query += ' AND score <= ?'
        params.push(max)
      }
    }

    query += ' ORDER BY score ASC'
    const rows = await db.all(query, ...params)
    return rows.map(r => r.member)
  }
}

