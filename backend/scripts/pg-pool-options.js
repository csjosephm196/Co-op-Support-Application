/**
 * Shared Pool options for scripts — matches src/config/db.ts SSL behavior.
 */
function poolOptions() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { connectionString: undefined };
  }
  const ssl =
    connectionString.includes('render.com') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : undefined;
  return { connectionString, ssl };
}

module.exports = { poolOptions };
