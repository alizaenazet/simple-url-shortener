import jwt from 'jsonwebtoken';
import { pgPool, dbHealth } from '../config/db.js';

// JWT expiration in seconds (30 minutes)
const JWT_EXPIRATION = 30 * 60;

export function generateToken(payload) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET || 'your-secret-key');
}

export async function verifyToken(token) {
  try {
    // 1. Verify the token based on secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 2. Check if token has expired (more than 30 minutes old)
    const currentTime = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp < currentTime) {
      throw new Error('Token has expired');
    }

    // 3. Check if token is in blacklist (if postgres is available)
    if (dbHealth.postgres.connected) {
      try {
        const result = await pgPool.query('SELECT 1 FROM token_blacklist WHERE token = $1', [token]);
        if (result.rowCount > 0) {
          throw new Error('Token has been blacklisted');
        }
      } catch (dbError) {
        // Log but continue - we don't want DB issues to prevent valid tokens from working
        console.warn('Could not check token blacklist:', dbError.message);
      }
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
}

export async function blacklistToken(token) {
  if (!dbHealth.postgres.connected) {
    console.warn('Cannot blacklist token: PostgreSQL not connected');
    return false;
  }

  try {
    await pgPool.query('INSERT INTO token_blacklist(token) VALUES($1) ON CONFLICT DO NOTHING', [token]);
    return true;
  } catch (error) {
    console.error('Error blacklisting token:', error.message);
    return false;
  }
}