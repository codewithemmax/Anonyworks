import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.SUPABASE_DB_URL) {
  throw new Error('SUPABASE_DB_URL is missing. Add it to .env.local before initializing the database.');
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'company')),
      name VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) DEFAULT 'Anonymous Feedback',
      is_active BOOLEAN DEFAULT TRUE,
      force_professional BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      pit_id UUID NOT NULL REFERENCES pits(id) ON DELETE CASCADE,
      original_message TEXT NOT NULL,
      processed_message TEXT,
      is_professional BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_pit_id ON messages(pit_id);
    CREATE INDEX IF NOT EXISTS idx_pits_creator_id ON pits(creator_id);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE pits ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Anonymous Feedback';
    ALTER TABLE pits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE pits ADD COLUMN IF NOT EXISTS force_professional BOOLEAN DEFAULT FALSE;
    ALTER TABLE pits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day');
    ALTER TABLE pits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS processed_message TEXT;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT FALSE;

    ALTER TABLE pits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  `);
  console.log('Database tables are ready.');
} finally {
  await pool.end();
}
