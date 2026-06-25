import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const result = await pool.query('SELECT id, text, done, due, priority FROM tasks ORDER BY id DESC LIMIT 15');
    console.log("Current Tasks in DB:");
    result.rows.forEach(r => {
      console.log(`- [${r.done ? 'DONE' : 'ACTIVE'}] ID: ${r.id}, Text: "${r.text}", Due: "${r.due}", Priority: "${r.priority}"`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
