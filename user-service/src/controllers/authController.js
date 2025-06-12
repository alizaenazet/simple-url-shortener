import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { findUserByUsername, createUser } from '../models/userModel.js';
import { generateToken, blacklistToken } from '../utils/jwtHelper.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export async function register(req, res) {
  try {
    const { username, password, email = `${username}@example.com` } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json(errorResponse(
        'Validation failed.',
        [
          { field: !username ? 'username' : 'password', message: `${!username ? 'Username' : 'Password'} is required.` }
        ]
      ));
    }

    if (password.length < 8) {
      return res.status(400).json(errorResponse(
        'Validation failed.',
        [{ field: 'password', message: 'Password must be at least 8 characters long.' }]
      ));
    }

    // Check if username already exists
    try {
      const existingUser = await findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json(errorResponse(
          'Username already exists.',
          [{ field: 'username', message: 'This username is already taken. Please choose another one.' }]
        ));
      }
    } catch (error) {
      if (error.message === 'Database unavailable') {
        return res.status(503).json(errorResponse(
          'Service temporarily unavailable.',
          [{ code: 'DATABASE_UNAVAILABLE', message: 'Registration service is unavailable. Please try again later.' }]
        ));
      }
      throw error; // For other errors, pass to catch block below
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, email, hashedPassword);

    return res.status(201).json(successResponse(
      'User registered successfully.',
      {
        userId: newUser.id,
        username: newUser.username
      }
    ));
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    
    if (error.status === 409) {
      return res.status(409).json(errorResponse(
        error.message || 'Username already exists.',
        [{ field: error.field || 'username', message: error.message || 'This username is already taken.' }]
      ));
    }

    return res.status(500).json(errorResponse(
      'An internal server error occurred. Please try again later.',
      [{ code: 'REGISTRATION_FAILED', message: 'Failed to process user registration.' }]
    ));
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json(errorResponse(
        'Validation failed.',
        [
          { field: !username ? 'username' : 'password', message: `${!username ? 'Username' : 'Password'} is required.` }
        ]
      ));
    }

    // Find user
    let user;
    try {
      user = await findUserByUsername(username);
    } catch (error) {
      if (error.message === 'Database unavailable') {
        return res.status(503).json(errorResponse(
          'Service temporarily unavailable.',
          [{ code: 'DATABASE_UNAVAILABLE', message: 'Authentication service is unavailable. Please try again later.' }]
        ));
      }
      throw error;
    }

    if (!user) {
      return res.status(401).json(errorResponse(
        'Invalid username or password.',
        [{ code: 'INVALID_CREDENTIALS', message: 'The username or password provided is incorrect.' }]
      ));
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse(
        'Invalid username or password.',
        [{ code: 'INVALID_CREDENTIALS', message: 'The username or password provided is incorrect.' }]
      ));
    }

    // Generate token
    const token = generateToken({ userId: user.id, username: user.username });

    return res.status(200).json(successResponse(
      'Login successful.',
      {
        token,
        user: {
          userId: user.id,
          username: user.username
        }
      }
    ));
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json(errorResponse(
      'An internal server error occurred during login.',
      [{ code: 'LOGIN_PROCESS_FAILED', message: 'Failed to process login request.' }]
    ));
  }
}

export async function logout(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await blacklistToken(token);
    }
    
    return res.status(200).json(successResponse('Logout successful.'));
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    return res.status(500).json(errorResponse(
      'An internal server error occurred during logout.',
      [{ code: 'LOGOUT_PROCESS_FAILED', message: 'Failed to process logout request.' }]
    ));
  }
}