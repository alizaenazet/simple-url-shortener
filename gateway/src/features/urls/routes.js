import express from 'express';
import { urlController } from './controller.js';
import { authenticateToken } from '../../middleware/auth.js';

export const urlRoutes = express.Router();

urlRoutes.post('/', authenticateToken, urlController.create);
urlRoutes.get('/', authenticateToken, urlController.getAll);
urlRoutes.get('/:shortCode', authenticateToken, urlController.getOne);
urlRoutes.delete('/:shortCode', authenticateToken, urlController.delete);
