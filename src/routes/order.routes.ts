import { Router } from 'express';
import {
    createOrder,
    listMyOrders,
    getOrderById,
    cancelOrder
} from '../controllers/order.controller.js';

const router = Router();

// Toàn bộ nhóm tuyến này đã đi qua authMiddleware khi đăng ký trong app.ts
router.route('/').get(listMyOrders).post(createOrder);
router.route('/:id').get(getOrderById);
router.route('/:id/cancel').patch(cancelOrder);

export default router;