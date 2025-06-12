import express from 'express';
import { healthController } from './controller.js';

export const healthRoutes = express.Router();

healthRoutes.get('/', healthController.root);
healthRoutes.get('/health', healthController.health);
healthRoutes.get('/status', healthController.status);
