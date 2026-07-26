import { Router } from 'express';
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    updateCategory
} from '../controllers/category.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();
const adminOnly = [authMiddleware, adminMiddleware] as const;

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post('/', ...adminOnly, createCategory);
router.put('/:id', ...adminOnly, updateCategory);
router.delete('/:id', ...adminOnly, deleteCategory);

export default router;
