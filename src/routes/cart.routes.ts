import { Router } from 'express';
import {
    getCart,
    addCartItem,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
} from '../controllers/cart.controller.js';

const router = Router();

// Toàn bộ nhóm tuyến này đã đi qua authMiddleware khi đăng ký trong app.ts
router.route('/').get(getCart).delete(clearCart);
router.route('/items').post(addCartItem);
router
    .route('/items/:itemId')
    .patch(updateCartItemQuantity)
    .delete(removeCartItem);

export default router;
