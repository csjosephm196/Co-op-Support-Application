import '../loadEnv';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

/** TLS for cloud Postgres (Render, Neon, Supabase). Localhost URLs skip SSL. */
function sslForUrl(url: string | undefined): boolean | { rejectUnauthorized: boolean } | undefined {
  if (!url) return undefined;
  if (
    url.includes('render.com') ||
    url.includes('neon.tech') ||
    url.includes('supabase.co')
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const pool = new Pool({
  connectionString,
  ssl: sslForUrl(connectionString),
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
