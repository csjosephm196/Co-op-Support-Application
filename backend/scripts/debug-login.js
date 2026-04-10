require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolOptions } = require('./pg-pool-options');

(async () => {
  const pool = new Pool(poolOptions());
  try {
    const r = await pool.query(
      `SELECT id, email, password_hash, role FROM users WHERE email = $1 AND is_active = true`,
      ['admin@csa-portal.com']
    );
    console.log('rows', r.rows.length);
    if (!r.rows.length) return;
    const u = r.rows[0];
    console.log('id type', typeof u.id, u.id);
    const ok = await bcrypt.compare('Admin123!@#', u.password_hash);
    console.log('bcrypt ok', ok);
    const token = jwt.sign(
      { userId: u.id, email: u.email, role: u.role },
      process.env.JWT_SECRET || 'x',
      { expiresIn: '24h' }
    );
    console.log('token len', token.length);
  } catch (e) {
    console.error('ERR', e);
  } finally {
    await pool.end();
  }
})();
