import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
  rejectUnauthorized: false
}
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Supabase connection error:', err);
});
