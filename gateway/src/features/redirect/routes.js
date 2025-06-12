import express from 'express';
import { redirectController } from './controller.js';

export const redirectRoutes = express.Router();

redirectRoutes.get('/:shortCode', redirectController.redirect);
