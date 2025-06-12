import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import validateFields from '../middleware/validateInput.js';

const router = express.Router();

router.post('/register', validateFields(['username', 'password']), register);
router.post('/login', validateFields(['username', 'password']), login);
router.post('/logout', logout);

export default router;