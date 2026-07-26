import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import addressRoutes from './address.routes.js';

const router = Router();

// Mọi tuyến dưới /user đều yêu cầu đăng nhập.
router.use(authMiddleware);

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.patch('/me/password', changePassword);

router.use('/addresses', addressRoutes);

export default router;
