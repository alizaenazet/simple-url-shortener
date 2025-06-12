import { pgPool, dbHealth } from '../config/db.js';

export async function findUserByUsername(username) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  try {
    const result = await pgPool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding user:', error);
    throw new Error('Database error when finding user');
  }
}

export async function createUser(username, email, hashedPassword) {
  if (!dbHealth.postgres.connected) {
    throw new Error('Database unavailable');
  }

  try {
    const result = await pgPool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username',
      [username, email, hashedPassword]
    );
    return result.rows[0];
  } catch (error) {
    // Check for unique constraint violation (username already exists)
    if (error.code === '23505') {
      if (error.constraint.includes('username')) {
        const customError = new Error('Username already exists');
        customError.field = 'username';
        customError.status = 409;
        throw customError;
      }
      if (error.constraint.includes('email')) {
        const customError = new Error('Email already exists');
        customError.field = 'email';
        customError.status = 409;
        throw customError;
      }
    }
    
    console.error('Error creating user:', error);
    throw new Error('Database error when creating user');
  }
}