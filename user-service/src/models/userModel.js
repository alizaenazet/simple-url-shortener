import { pgPool } from '../config/db.js';

export async function findUserByUsername(username) {
  const result = await pgPool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

export async function createUser(userId, username, hashedPassword) {
  const result = await pgPool.query(
    'INSERT INTO users (userid, username, password) VALUES ($1, $2, $3) RETURNING userid, username',
    [userId, username, hashedPassword]
  );
  return result.rows[0];
}