import { createClient } from 'redis';
import pkg from 'pg';
const { Pool } = pkg;

// Database health status
export const dbHealth = {
  redis: { connected: false, lastError: null, lastChecked: null },
  postgres: { connected: false, lastError: null, lastChecked: null }
};

// Redis configuration with better error handling
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log('Redis: Max reconnection attempts reached, marking as disconnected');
        dbHealth.redis.connected = false;
        return false; // Stop trying to reconnect
      }
      const delay = Math.min(retries * 50, 3000);
      console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
    connectTimeout: 5000,
    lazyConnect: true
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
  dbHealth.redis.connected = false;
  dbHealth.redis.lastError = err.message;
  dbHealth.redis.lastChecked = new Date();
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
  dbHealth.redis.connected = true;
  dbHealth.redis.lastError = null;
  dbHealth.redis.lastChecked = new Date();
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
  dbHealth.redis.connected = false;
  dbHealth.redis.lastChecked = new Date();
});

// PostgreSQL configuration
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'users',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pgPool.on('connect', () => {
  console.log('Connected to PostgreSQL');
  dbHealth.postgres.connected = true;
  dbHealth.postgres.lastError = null;
  dbHealth.postgres.lastChecked = new Date();
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err.message);
  dbHealth.postgres.connected = false;
  dbHealth.postgres.lastError = err.message;
  dbHealth.postgres.lastChecked = new Date();
});

// Initialize dummy data for testing
export async function initializeDummyData() {
  try {
    console.log('Initializing dummy data for testing...');
    
    // Create short_urls table if it doesn't exist
    // await pgPool.query(`
    //   CREATE TABLE IF NOT EXISTS short_urls (
    //     id SERIAL PRIMARY KEY,
    //     short_url_id UUID DEFAULT gen_random_uuid(),
    //     user_id UUID,
    //     long_url TEXT NOT NULL,
    //     short_code VARCHAR(50) UNIQUE NOT NULL,
    //     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    //     expires_at TIMESTAMP WITH TIME ZONE,
    //     visits INTEGER DEFAULT 0
    //   )
    // `);

    // // Insert dummy data into PostgreSQL
    // const dummyUrls = [
    //   {
    //     shortCode: 'google',
    //     longUrl: 'https://www.google.com',
    //     expiresInDays: 30
    //   },
    //   {
    //     shortCode: 'github',
    //     longUrl: 'https://github.com',
    //     expiresInDays: 30
    //   },
    //   {
    //     shortCode: 'stackoverflow',
    //     longUrl: 'https://stackoverflow.com',
    //     expiresInDays: 30
    //   },
    //   {
    //     shortCode: 'youtube',
    //     longUrl: 'https://www.youtube.com',
    //     expiresInDays: 30
    //   },
    //   {
    //     shortCode: 'test',
    //     longUrl: 'https://httpbin.org/json',
    //     expiresInDays: 7
    //   }
    // ];

    // for (const url of dummyUrls) {
    //   const expiresAt = new Date();
    //   expiresAt.setDate(expiresAt.getDate() + url.expiresInDays);

    //   // Insert into PostgreSQL (with ON CONFLICT to avoid duplicates)
    //   await pgPool.query(`
    //     INSERT INTO short_urls (long_url, short_code, expires_at, visits)
    //     VALUES ($1, $2, $3, $4)
    //     ON CONFLICT (short_code) DO UPDATE SET
    //       long_url = EXCLUDED.long_url,
    //       expires_at = EXCLUDED.expires_at
    //   `, [url.longUrl, url.shortCode, expiresAt, 0]);

    //   // Insert into Redis with TTL
    //   const ttlSeconds = url.expiresInDays * 24 * 60 * 60;
    //   await redisClient.setEx(`shorturl:${url.shortCode}`, ttlSeconds, url.longUrl);

    //   console.log(`✓ Added dummy URL: ${url.shortCode} -> ${url.longUrl}`);
    // }

    // console.log('Dummy data initialized successfully!');
    // console.log('\nTest with these URLs:');
    // dummyUrls.forEach(url => {
    //   console.log(`  curl http://localhost:3002/service/redirect/${url.shortCode}`);
    //   console.log(`  curl http://localhost:3002/${url.shortCode}`);
    // });

  } catch (error) {
    console.error('Error initializing dummy data:', error);
    // Don't throw error here as it shouldn't prevent the service from starting
  }
}

// Redis operations with fallback
export async function getFromRedis(key) {
  if (!dbHealth.redis.connected) {
    return null;
  }

  try {
    const result = await redisClient.get(key);
    dbHealth.redis.connected = true;
    dbHealth.redis.lastError = null;
    dbHealth.redis.lastChecked = new Date();
    return result;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error.message);
    dbHealth.redis.connected = false;
    dbHealth.redis.lastError = error.message;
    dbHealth.redis.lastChecked = new Date();
    return null;
  }
}

// PostgreSQL operations with error handling
export async function getFromPostgres(shortCode) {
  if (!dbHealth.postgres.connected) {
    return null;
  }

  const client = await pgPool.connect();
  try {
    const result = await client.query(
      'SELECT long_url FROM short_urls WHERE short_code = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [shortCode]
    );
    
    dbHealth.postgres.connected = true;
    dbHealth.postgres.lastError = null;
    dbHealth.postgres.lastChecked = new Date();
    
    return result.rows.length > 0 ? result.rows[0].long_url : null;
  } catch (error) {
    console.error(`PostgreSQL GET error for shortCode ${shortCode}:`, error.message);
    dbHealth.postgres.connected = false;
    dbHealth.postgres.lastError = error.message;
    dbHealth.postgres.lastChecked = new Date();
    return null;
  } finally {
    client.release();
  }
}

// Health check functions
export async function checkRedisHealth() {
  try {
    if (!dbHealth.redis.connected) {
      await redisClient.connect();
    }
    await redisClient.ping();
    dbHealth.redis.connected = true;
    dbHealth.redis.lastError = null;
    dbHealth.redis.lastChecked = new Date();
    return true;
  } catch (error) {
    dbHealth.redis.connected = false;
    dbHealth.redis.lastError = error.message;
    dbHealth.redis.lastChecked = new Date();
    return false;
  }
}

export async function checkPostgresHealth() {
  try {
    await pgPool.query('SELECT 1');
    dbHealth.postgres.connected = true;
    dbHealth.postgres.lastError = null;
    dbHealth.postgres.lastChecked = new Date();
    return true;
  } catch (error) {
    dbHealth.postgres.connected = false;
    dbHealth.postgres.lastError = error.message;
    dbHealth.postgres.lastChecked = new Date();
    return false;
  }
}

// Periodic health checks
function startHealthChecks() {
  setInterval(async () => {
    await checkRedisHealth();
    await checkPostgresHealth();
  }, 30000); // Check every 30 seconds
}

// Initialize connections with better error handling
export async function initializeDatabases() {
  console.log('Initializing database connections...');
  
  // Try Redis connection (non-blocking)
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    console.log('Service will continue with PostgreSQL only');
  }

  // Try PostgreSQL connection
  try {
    await pgPool.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    if (!dbHealth.redis.connected) {
      throw new Error('Both Redis and PostgreSQL connections failed. Service cannot start.');
    }
  }

  // Start health monitoring
  startHealthChecks();
  
  // Initialize dummy data if possible
  try {
    await initializeDummyData();
  } catch (error) {
    console.error('Failed to initialize dummy data:', error.message);
  }

  console.log('Database initialization completed');
  console.log(`Redis: ${dbHealth.redis.connected ? 'Connected' : 'Disconnected'}`);
  console.log(`PostgreSQL: ${dbHealth.postgres.connected ? 'Connected' : 'Disconnected'}`);
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
