import { Router } from 'express';
import {
    register,
    login,
    refresh,
    logout
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

export default router;
