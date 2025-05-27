import { redisClient, pgPool } from '../../config/database.js';

export class RedirectService {
  
  async getLongUrl(shortCode) {
    try {
      // Get longUrl from Redis
      const longUrl = await redisClient.get(`shorturl:${shortCode}`);
      
      if (!longUrl) {
        return {
          success: false,
          error: {
            code: 'SHORT_URL_UNAVAILABLE',
            message: 'The requested short URL does not exist or is no longer active.'
          }
        };
      }

      // Asynchronously increment visit count in PostgreSQL
      this.incrementVisitCount(shortCode).catch(err => {
        console.error('Failed to increment visit count:', err);
        // Don't throw error here as it shouldn't block the redirect
      });

      return {
        success: true,
        data: { longUrl }
      };

    } catch (error) {
      console.error('Error in getLongUrl:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred during redirection.'
        }
      };
    }
  }

  async incrementVisitCount(shortCode) {
    const client = await pgPool.connect();
    try {
      await client.query(
        'UPDATE short_urls SET visits = visits + 1 WHERE short_code = $1',
        [shortCode]
      );
    } catch (error) {
      console.error('Error incrementing visit count:', error);
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
          redirectDelay: 3000 // 3 seconds
        }
      };

    } catch (error) {
      console.error('Error in getRedirectPageData:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred.'
        }
      };
    }
  }
}
