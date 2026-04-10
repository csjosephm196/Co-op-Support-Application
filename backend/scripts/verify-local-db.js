/**
 * Verify local (or any) Postgres: connection, users, admin password for README credentials.
 * Run from backend/: npm run db:verify
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { poolOptions } = require('./pg-pool-options');

const MIGRATION_ADMIN_HASH =
  '$2a$12$FqQIHm8gSAANli0HD9H9kujBVRCOfuIZcpIyZhxOKbSOx4KEAQxDG';

async function main() {
  const opts = poolOptions();
  if (!opts.connectionString) {
    console.error('DATABASE_URL missing — set it in backend/.env');
    process.exit(1);
  }

  const pool = new Pool(opts);
  try {
    await pool.query('SELECT 1');
    console.log('Database: connected OK');

    const { rows: users } = await pool.query(
      `SELECT email, role, is_active FROM users ORDER BY email`
    );
    console.log(`Users: ${users.length} row(s)`);
    users.forEach((u) => console.log(`  ${u.email} (${u.role}) active=${u.is_active}`));

    const { rows } = await pool.query(
      `SELECT password_hash FROM users WHERE email = 'admin@csa-portal.com' AND is_active = true`
    );
    if (rows.length === 0) {
      console.log('\nNo active admin@csa-portal.com — run: npm run migrate');
      process.exit(1);
    }

    const ok = await bcrypt.compare('Admin123!@#', rows[0].password_hash);
    if (ok) {
      console.log('\nAdmin login: admin@csa-portal.com / Admin123!@# — OK');
    } else {
      console.log('\nAdmin password out of sync — resetting hash to match README...');
      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE email = 'admin@csa-portal.com'`,
        [MIGRATION_ADMIN_HASH]
      );
      console.log('Done. Use: admin@csa-portal.com / Admin123!@#');
    }

    const testUser = await pool.query(
      `SELECT 1 FROM users WHERE email = 'student@test.com' AND is_active = true`
    );
    if (testUser.rows.length) {
      console.log('Test student present: student@test.com / Test1234!@# (after seed-test-data.js)');
    }
  } catch (e) {
    console.error('Error:', e.message);
    if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT') {
      console.error('Tip: cloud DB needs ?sslmode=require in URL; Render/Neon use SSL from poolOptions.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
