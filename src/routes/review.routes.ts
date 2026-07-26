import { Router } from 'express';
import { deleteReview, updateReview } from '../controllers/review.controller.js';

const router = Router();

// Toàn bộ nhóm tuyến này đã đi qua authMiddleware khi đăng ký trong app.ts
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
