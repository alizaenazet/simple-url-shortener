import { pgPool } from '../config/db.js';

export async function isShortCodeTaken(shortCode) {
  const result = await pgPool.query(
    'SELECT 1 FROM short_urls WHERE short_code = $1',
    [shortCode]
  );
  return result.rowCount > 0;
}

export async function createShortUrl({
  shortUrlId,
  userId,
  longUrl,
  shortCode,
  createdAt,
  expiresAt
}) {
  const result = await pgPool.query(
    `INSERT INTO short_urls 
      (short_url_id, user_id, long_url, short_code, created_at, expires_at, visits)
     VALUES ($1, $2, $3, $4, $5, $6, 0)
     RETURNING *`,
    [shortUrlId, userId, longUrl, shortCode, createdAt, expiresAt]
  );
  return result.rows[0];
}

export async function getUserShortUrls(userId) {
  const result = await pgPool.query(
    'SELECT * FROM short_urls WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getShortUrlDetail(userId, shortCode) {
  const result = await pgPool.query(
    'SELECT * FROM short_urls WHERE user_id = $1 AND short_code = $2',
    [userId, shortCode]
  );
  return result.rows[0];
}

export async function deleteShortUrl(userId, shortCode) {
  const result = await pgPool.query(
    'DELETE FROM short_urls WHERE user_id = $1 AND short_code = $2',
    [userId, shortCode]
  );
  return result.rowCount > 0;
}