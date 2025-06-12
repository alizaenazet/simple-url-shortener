import express from 'express';
import { authController } from './controller.js';

export const authRoutes = express.Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
