dotenv.config();
import dotenv from 'dotenv';

import { createClient } from 'redis';
import pkg from 'pg';
const { Pool } = pkg;

export let redisClient;

export function initRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('[REDIS] Connecting to:', url);
  redisClient = createClient({ url });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  return redisClient.connect();
}

// PostgreSQL configuration
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'users',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err);
});

export async function initializeDummyData() {
  try {
    console.log('Initializing dummy data for testing...');

    // 🔒 Pastikan Redis sudah connect
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        userid UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        short_url_id UUID DEFAULT gen_random_uuid(),
        user_id UUID,
        long_url TEXT NOT NULL,
        short_code VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        visits INTEGER DEFAULT 0
      )
    `);

    const dummyUrls = [
      { shortCode: 'google', longUrl: 'https://www.google.com', expiresInDays: 30 },
      { shortCode: 'github', longUrl: 'https://github.com', expiresInDays: 30 },
      { shortCode: 'stackoverflow', longUrl: 'https://stackoverflow.com', expiresInDays: 30 },
      { shortCode: 'youtube', longUrl: 'https://www.youtube.com', expiresInDays: 30 },
      { shortCode: 'test', longUrl: 'https://httpbin.org/json', expiresInDays: 7 }
    ];

    for (const url of dummyUrls) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + url.expiresInDays);

      await pgPool.query(`
        INSERT INTO short_urls (long_url, short_code, expires_at, visits)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (short_code) DO UPDATE SET
          long_url = EXCLUDED.long_url,
          expires_at = EXCLUDED.expires_at
      `, [url.longUrl, url.shortCode, expiresAt, 0]);

      const ttlSeconds = url.expiresInDays * 24 * 60 * 60;
      await redisClient.setEx(`shorturl:${url.shortCode}`, ttlSeconds, url.longUrl);

      console.log(`✓ Added dummy URL: ${url.shortCode} → ${url.longUrl}`);
    }

    console.log('✅ Dummy data initialized!');
  } catch (error) {
    console.error('Error initializing dummy data:', error);
  }
}

export async function initializeDatabases() {
  try {
    await initRedis();
    await pgPool.query('SELECT NOW()');
    console.log('✅ All database connections established');
    await initializeDummyData();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabases() {
  try {
    if (redisClient) await redisClient.quit();
    await pgPool.end();
    console.log('🛑 Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}