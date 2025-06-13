import { Router } from 'express';
import { qrController } from './controller.js';

const router = Router();

// POST /qr - Generate QR code (public endpoint, no authentication required)
router.post('/', qrController.generateQR);

export { router as qrRoutes };
