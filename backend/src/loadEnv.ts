import path from 'path';
import dotenv from 'dotenv';

// Load backend/.env regardless of process.cwd() (e.g. monorepo root or IDE tasks).
// In dev, override existing env vars so a machine-level DATABASE_URL does not shadow .env.
dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: process.env.NODE_ENV !== 'production',
});
