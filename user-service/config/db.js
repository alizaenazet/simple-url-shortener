import { createClient } from 'redis';
import pkg from 'pg';
const { Pool } = pkg;

// Redis configuration
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

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
  console.log('Connected to PostgreSQL');
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err);
});

// Initialize dummy data for testing
export async function initializeDummyData() {
  try {
    console.log('Initializing dummy data for testing...');

    //TAMBAHAN DI SINIIIIIII
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        userid UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create short_urls table if it doesn't exist
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

    // Insert dummy data into PostgreSQL
    const dummyUrls = [
      {
        shortCode: 'google',
        longUrl: 'https://www.google.com',
        expiresInDays: 30
      },
      {
        shortCode: 'github',
        longUrl: 'https://github.com',
        expiresInDays: 30
      },
      {
        shortCode: 'stackoverflow',
        longUrl: 'https://stackoverflow.com',
        expiresInDays: 30
      },
      {
        shortCode: 'youtube',
        longUrl: 'https://www.youtube.com',
        expiresInDays: 30
      },
      {
        shortCode: 'test',
        longUrl: 'https://httpbin.org/json',
        expiresInDays: 7
      }
    ];

    for (const url of dummyUrls) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + url.expiresInDays);

      // Insert into PostgreSQL (with ON CONFLICT to avoid duplicates)
      await pgPool.query(`
        INSERT INTO short_urls (long_url, short_code, expires_at, visits)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (short_code) DO UPDATE SET
          long_url = EXCLUDED.long_url,
          expires_at = EXCLUDED.expires_at
      `, [url.longUrl, url.shortCode, expiresAt, 0]);

      // Insert into Redis with TTL
      const ttlSeconds = url.expiresInDays * 24 * 60 * 60;
      await redisClient.setEx(`shorturl:${url.shortCode}`, ttlSeconds, url.longUrl);

      console.log(`✓ Added dummy URL: ${url.shortCode} -> ${url.longUrl}`);
    }

    console.log('Dummy data initialized successfully!');
    console.log('\nTest with these URLs:');
    dummyUrls.forEach(url => {
      console.log(`  curl http://localhost:3002/service/redirect/${url.shortCode}`);
      console.log(`  curl http://localhost:3002/${url.shortCode}`);
    });

  } catch (error) {
    console.error('Error initializing dummy data:', error);
    // Don't throw error here as it shouldn't prevent the service from starting
  }
}

// Initialize connections
export async function initializeDatabases() {
  try {
    await redisClient.connect();
    await pgPool.query('SELECT NOW()'); // Test PostgreSQL connection
    console.log('All database connections established');
    
    // Initialize dummy data for testing
    await initializeDummyData();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabases() {
  try {
    await redisClient.quit();
    await pgPool.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }

}
