import { Router } from 'express';
import {
    listMyAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../controllers/address.controller.js';

const router = Router();

// Toàn bộ nhóm tuyến này đã đi qua authMiddleware khi đăng ký trong user.routes.ts
router.route('/').get(listMyAddresses).post(createAddress);
router.route('/:id').put(updateAddress).delete(deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
