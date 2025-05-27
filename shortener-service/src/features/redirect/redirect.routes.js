import { Router } from 'express';
import { RedirectController } from './redirect.controller.js';

const router = Router();
const redirectController = new RedirectController();

// Internal service endpoint for API Gateway
router.get('/service/redirect/:shortCode', redirectController.getRedirectData.bind(redirectController));

// Direct redirect endpoint for browser access
router.get('/:shortCode', redirectController.redirectToLongUrl.bind(redirectController));

export { router as redirectRoutes };
