import { getDb } from '../lib/db'
async function run() {
    const db = await getDb()
    await db.run("DELETE FROM kv WHERE key LIKE 'news_ai:%'")
    console.log("Done")
}
run()
