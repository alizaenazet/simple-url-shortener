import { pgPool, dbHealth } from '../config/db.js';

export async function isShortCodeTaken(shortCode) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  try {
    const result = await pgPool.query(
      'SELECT 1 FROM short_urls WHERE short_code = $1',
      [shortCode]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Database error checking shortcode:', error);
    throw new Error('Database error when checking shortcode');
  }
}

export async function createShortUrl({
  shortUrlId,
  userId,
  longUrl,
  shortCode,
  createdAt,
  expiresAt
}) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO short_urls 
        (short_url_id, user_id, long_url, short_code, created_at, expires_at, visits)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [shortUrlId, userId, longUrl, shortCode, createdAt, expiresAt]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error creating shorturl:', error);
    
    if (error.code === '23505' && error.constraint.includes('short_code')) {
      // Duplicate short code - handle this specially
      throw new Error('Short code already taken');
    }
    
    throw new Error('Database error when creating short URL');
  } finally {
    client.release();
  }
}

export async function getUserShortUrls(userId, options = {}) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  const { page = 1, limit = 10, sortField = 'created_at', sortOrder = 'DESC', status = 'all' } = options;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT * FROM short_urls 
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];
    let paramCounter = 2;
    
    // Add status filter if not 'all'
    if (status === 'active') {
      query += ` AND expires_at > NOW()`;
    } else if (status === 'expired') {
      query += ` AND expires_at <= NOW()`;
    }
    
    // Add ordering
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
    queryParams.push(limit, offset);
    
    // Execute query
    const result = await pgPool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM short_urls 
      WHERE user_id = $1
      ${status === 'active' ? ' AND expires_at > NOW()' : 
        status === 'expired' ? ' AND expires_at <= NOW()' : ''}
    `;
    
    const countResult = await pgPool.query(countQuery, [userId]);
    const totalItems = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Database error getting user urls:', error);
    throw new Error('Database error when retrieving user URLs');
  }
}

export async function getShortUrlDetail(userId, shortCode) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  try {
    const result = await pgPool.query(
      'SELECT * FROM short_urls WHERE user_id = $1 AND short_code = $2',
      [userId, shortCode]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database error getting url details:', error);
    throw new Error('Database error when retrieving URL details');
  }
}

export async function deleteShortUrl(userId, shortCode) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'DELETE FROM short_urls WHERE user_id = $1 AND short_code = $2 RETURNING id',
      [userId, shortCode]
    );
    
    await client.query('COMMIT');
    return result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error deleting shorturl:', error);
    throw new Error('Database error when deleting short URL');
  } finally {
    client.release();
  }
}