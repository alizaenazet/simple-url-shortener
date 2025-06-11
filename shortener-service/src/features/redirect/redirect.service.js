import { getFromRedis, getFromPostgres, pgPool, dbHealth } from '../../config/database.js';

export class RedirectService {
  
  async getLongUrl(shortCode) {
    try {
      let longUrl = null;
      let sourceDatabase = null;

      // Try Redis first (primary database)
      if (dbHealth.redis.connected) {
        console.log(`Attempting to fetch ${shortCode} from Redis`);
        longUrl = await getFromRedis(`shorturl:${shortCode}`);
        if (longUrl) {
          sourceDatabase = 'redis';
          console.log(`✓ Found ${shortCode} in Redis`);
        } else {
          console.log(`✗ ${shortCode} not found in Redis`);
        }
      } else {
        console.log('Redis unavailable, skipping Redis lookup');
      }

      // Fallback to PostgreSQL if Redis failed or returned null
      if (!longUrl && dbHealth.postgres.connected) {
        console.log(`Attempting to fetch ${shortCode} from PostgreSQL`);
        longUrl = await getFromPostgres(shortCode);
        if (longUrl) {
          sourceDatabase = 'postgres';
          console.log(`✓ Found ${shortCode} in PostgreSQL`);
        } else {
          console.log(`✗ ${shortCode} not found in PostgreSQL`);
        }
      } else if (!longUrl) {
        console.log('PostgreSQL unavailable, cannot fallback');
      }

      if (!longUrl) {
        return {
          success: false,
          error: {
            code: 'SHORT_URL_UNAVAILABLE',
            message: 'The requested short URL does not exist or is no longer active.',
            details: {
              redisStatus: dbHealth.redis.connected ? 'connected' : 'disconnected',
              postgresStatus: dbHealth.postgres.connected ? 'connected' : 'disconnected'
            }
          }
        };
      }

      // Asynchronously increment visit count (only if PostgreSQL is available)
      if (dbHealth.postgres.connected) {
        this.incrementVisitCount(shortCode).catch(err => {
          console.error('Failed to increment visit count:', err.message);
        });
      }

      return {
        success: true,
        data: { 
          longUrl,
          source: sourceDatabase,
          dbStatus: {
            redis: dbHealth.redis.connected ? 'connected' : 'disconnected',
            postgres: dbHealth.postgres.connected ? 'connected' : 'disconnected'
          }
        }
      };

    } catch (error) {
      console.error('Error in getLongUrl:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred during redirection.',
          details: {
            redisStatus: dbHealth.redis.connected ? 'connected' : 'disconnected',
            postgresStatus: dbHealth.postgres.connected ? 'connected' : 'disconnected'
          }
        }
      };
    }
  }

  async incrementVisitCount(shortCode) {
    if (!dbHealth.postgres.connected) {
      console.log('PostgreSQL unavailable, skipping visit count increment');
      return;
    }

    const client = await pgPool.connect();
    try {
      await client.query(
        'UPDATE short_urls SET visits = visits + 1 WHERE short_code = $1',
        [shortCode]
      );
    } catch (error) {
      console.error('Error incrementing visit count:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async getRedirectPageData(shortCode) {
    try {
      const result = await this.getLongUrl(shortCode);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: {
          longUrl: result.data.longUrl,
          shortCode,
          redirectDelay: 3000,
          source: result.data.source,
          dbStatus: result.data.dbStatus
        }
      };

    } catch (error) {
      console.error('Error in getRedirectPageData:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred.',
          details: {
            redisStatus: dbHealth.redis.connected ? 'connected' : 'disconnected',
            postgresStatus: dbHealth.postgres.connected ? 'connected' : 'disconnected'
          }
        }
      };
    }
  }

  // Get database health status
  getDatabaseStatus() {
    return {
      redis: {
        connected: dbHealth.redis.connected,
        lastError: dbHealth.redis.lastError,
        lastChecked: dbHealth.redis.lastChecked
      },
      postgres: {
        connected: dbHealth.postgres.connected,
        lastError: dbHealth.postgres.lastError,
        lastChecked: dbHealth.postgres.lastChecked
      }
    };
  }
}
