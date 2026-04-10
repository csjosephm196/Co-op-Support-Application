/**
 * Run 002 only if deadlines table is missing (when 001 was applied earlier).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { poolOptions } = require('./pg-pool-options');

async function main() {
  const pool = new Pool(poolOptions());
  try {
    const { rows } = await pool.query(
      "SELECT to_regclass('public.deadlines') AS deadlines"
    );
    if (rows[0].deadlines) {
      console.log('002 already applied (deadlines table exists).');
      return;
    }
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/002_deadlines_and_templates.sql'),
      'utf-8'
    );
    console.log('Running 002_deadlines_and_templates.sql ...');
    await pool.query(sql);
    console.log('Completed 002.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
