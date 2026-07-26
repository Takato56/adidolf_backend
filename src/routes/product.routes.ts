import { Router } from 'express';
import {
    createProduct,
    createProductImages,
    deleteProduct,
    deleteProductImage,
    getAllProducts,
    getProductById,
    getProductBySlug,
    getProductImages,
    updateProduct,
    updateProductImage,
    uploadProductImages
} from '../controllers/product.controller.js';
import {
    createReview,
    listProductReviews
} from '../controllers/review.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { productImageUpload } from '../middleware/upload.middleware.js';

const router = Router();
const adminOnly = [authMiddleware, adminMiddleware] as const;

router.get('/', getAllProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/images', getProductImages);
router.get('/:id/reviews', listProductReviews);
router.post('/:id/reviews', authMiddleware, createReview);
router.get('/:id', getProductById);

router.post('/', ...adminOnly, createProduct);
router.put('/:id', ...adminOnly, updateProduct);
router.delete('/:id', ...adminOnly, deleteProduct);

router.post('/:id/images', ...adminOnly, createProductImages);
router.post(
    '/:id/images/upload',
    ...adminOnly,
    productImageUpload.array('images', 10),
    uploadProductImages
);
router.patch('/:id/images/:imageId', ...adminOnly, updateProductImage);
router.delete('/:id/images/:imageId', ...adminOnly, deleteProductImage);

export default router;
