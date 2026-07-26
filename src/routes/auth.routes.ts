import { Router } from 'express';
import {
    register,
    login,
    refresh,
    logout
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', authRateLimit, refresh);
router.post('/logout', authMiddleware, logout);

export default router;
