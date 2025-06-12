import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { findUserByUsername, createUser } from '../models/userModel.js';
import { generateToken } from '../utils/jwtHelper.js';

export async function register(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      errors: [{ field: 'username', message: 'Username and password required' }],
    });
  }

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        errors: [{ field: 'username', message: 'Username already exists.' }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const newUser = await createUser(userId, username, hashedPassword);
    return res.status(201).json(newUser);
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      errors: [{ field: 'username', message: 'Username and password required' }],
    });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        errors: [{ code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' }],
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        errors: [{ code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' }],
      });
    }

    const token = generateToken({ userId: user.userid, username: user.username });

    return res.status(200).json({
      token,
      user: {
        userId: user.userid,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}