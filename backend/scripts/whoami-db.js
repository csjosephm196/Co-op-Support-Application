/**
 * Prints which database backend/.env points at and whether public.users exists.
 * Run: node scripts/whoami-db.js (from backend/)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { poolOptions } = require('./pg-pool-options');

async function main() {
  const opts = poolOptions();
  const u = opts.connectionString || '';
  const host = (u.match(/@([^:/]+)/) || [])[1] || '?';
  const db = (u.match(/\/([^/?]+)(\?|$)/) || [])[1] || '?';
  console.log('From DATABASE_URL — host:', host, '| database:', db);

  const pool = new Pool(opts);
  try {
    const { rows } = await pool.query(`
      SELECT current_database() AS db,
             current_schema() AS schema,
             EXISTS (
               SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'users'
             ) AS has_users
    `);
    console.log('Live connection:', rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
