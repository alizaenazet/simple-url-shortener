import { Router } from 'express';
import { redirectRoutes } from '../features/redirect/redirect.routes.js';

const router = Router();

// Mount feature routes
router.use('/', redirectRoutes);

export { router as routes };
