import { pool } from './db.js';

const createTables = async () => {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS pits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL, 
        title VARCHAR(255) DEFAULT 'Anonymous Feedback',
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        pit_id UUID REFERENCES pits(id) ON DELETE CASCADE,
        original_message TEXT NOT NULL,
        processed_message TEXT,
        is_professional BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'company')),
        name VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
      CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

      -- Only keep indexes for tables that exist
      CREATE INDEX IF NOT EXISTS idx_messages_pit_id ON messages(pit_id);
      CREATE INDEX IF NOT EXISTS idx_pits_creator_id ON pits(creator_id);

      -- Enable RLS
      ALTER TABLE pits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

createTables();
