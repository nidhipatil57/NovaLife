const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const tasksRes = await pool.query('SELECT id, text, done, priority, due, category, user_id FROM tasks WHERE done = false');
    console.log('--- ACTIVE TASKS ---');
    console.log(tasksRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
