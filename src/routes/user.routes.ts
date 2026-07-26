import { Router } from 'express';
import { getProfile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', authMiddleware, getProfile);

export default router;
