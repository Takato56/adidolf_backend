import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/product.controller.js';
// import { authMiddleware } from '../middleware/auth.middleware.js';
// import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

// ─── Public ───────────────────────────────────────────────
router.get('/',           getAllProducts);
router.get('/:id',        getProductById);
router.get('/slug/:slug', getProductBySlug);

// ─── Admin only ───────────────────────────────────────────
// router.post('/',      authMiddleware, adminMiddleware, createProduct);
// router.put('/:id',    authMiddleware, adminMiddleware, updateProduct);
// router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;