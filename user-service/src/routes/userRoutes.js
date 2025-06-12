import express from 'express';
import {
  create,
  list,
  detail,
  remove
} from '../controllers/urlController.js';
import authenticate from '../middleware/authenticate.js';
import validateFields from '../middleware/validateInput.js';

const router = express.Router();

// All routes require authentication
router.use('/:userId/urls', authenticate);

// URL management routes
router.post('/:userId/urls', validateFields(['longUrl', 'expiresInDays']), create);
router.get('/:userId/urls', list);
router.get('/:userId/urls/:shortCode', detail);
router.delete('/:userId/urls/:shortCode', remove);

export default router;