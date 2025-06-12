import express from 'express';
import { register, login } from '../controllers/authController.js';
import validateFields from '../middleware/validateInput.js';

const router = express.Router();

router.post('/register', validateFields(['username', 'password']), register);
router.post('/login', validateFields(['username', 'password']), login);

export default router;