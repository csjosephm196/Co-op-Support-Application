/**
 * Wipes ALL tables/types in the public schema (destructive).
 * Use when migrations failed partway (e.g. "type user_role already exists").
 *
 * From backend/ with DATABASE_URL in .env:
 *   PowerShell: $env:RESET_PUBLIC_SCHEMA='yes'; npm run db:reset-schema
 *   Then: npm run migrate
 *
 * Do NOT use on production data you need to keep.
 */
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { poolOptions } = require('./pg-pool-options');

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: process.env.NODE_ENV !== 'production',
});

async function main() {
  if (process.env.RESET_PUBLIC_SCHEMA !== 'yes') {
    console.error(
      'Refusing to run: set RESET_PUBLIC_SCHEMA=yes in the environment to confirm.\n' +
        "Example (PowerShell): $env:RESET_PUBLIC_SCHEMA='yes'; npm run db:reset-schema"
    );
    process.exit(1);
  }

  const opts = poolOptions();
  if (!opts.connectionString) {
    console.error('DATABASE_URL missing — set it in backend/.env');
    process.exit(1);
  }

  const pool = new Pool(opts);
  const client = await pool.connect();
  try {
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('public schema reset OK — run: npm run migrate');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
