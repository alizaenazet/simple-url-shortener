import { Router } from 'express';
import { redirectRoutes } from '../features/redirect/redirect.routes.js';
import { RedirectService } from '../features/redirect/redirect.service.js';

const router = Router();
const redirectService = new RedirectService();

// Health check endpoint with database status
router.get('/health', (req, res) => {
  const dbStatus = redirectService.getDatabaseStatus();
  const isHealthy = dbStatus.redis.connected || dbStatus.postgres.connected;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    databases: dbStatus,
    message: isHealthy ? 
      'Service is operational' : 
      'Service is degraded - both databases unavailable'
  });
});

// Mount feature routes
router.use('/', redirectRoutes);

export { router as routes };
