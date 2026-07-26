import { Router } from 'express';
import { validateVoucher } from '../controllers/voucher.controller.js';

const router = Router();

// Toàn bộ nhóm tuyến này đã đi qua authMiddleware khi đăng ký trong app.ts
router.post('/validate', validateVoucher);

export default router;
