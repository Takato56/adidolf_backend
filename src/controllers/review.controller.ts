import { type Request, type Response } from 'express';
import ReviewModel from '../models/review.model.js';
import ProductModel from '../models/product.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    buildPaginatedResponse,
    parsePagination
} from '../utils/pagination.utils.js';
import {
    approveReviewSchema,
    createReviewSchema,
    reviewIdSchema,
    updateReviewSchema
} from '../validators/review.validator.js';
import { productIdSchema } from '../validators/product.validator.js';

const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

const getPublishedProductOrThrow = async (id: number) => {
    const product = await ProductModel.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
};

/** GET /products/:id/reviews — công khai, chỉ đánh giá đã duyệt, có phân trang */
export const listProductReviews = async (req: Request, res: Response) => {
    const productId = productIdSchema.parse(req.params.id);
    await getPublishedProductOrThrow(productId);

    const params = parsePagination(req.query);
    const { rows, total } = await ReviewModel.findApprovedByProduct(
        productId,
        params
    );

    res.json(buildPaginatedResponse(rows, total, params));
};

/**
 * POST /products/:id/reviews — chỉ người đã mua và nhận hàng (delivered)
 * mới được đánh giá. Nếu kèm order_item_id, mỗi lượt mua chỉ được đánh
 * giá đúng một lần.
 */
export const createReview = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const productId = productIdSchema.parse(req.params.id);
    await getPublishedProductOrThrow(productId);

    const dto = createReviewSchema.parse(req.body);

    if (dto.order_item_id !== undefined) {
        const item = await ReviewModel.findDeliveredOrderItem(
            dto.order_item_id,
            userId,
            productId
        );
        if (!item) {
            throw new AppError(
                'This order item is not a delivered purchase of yours for this product',
                403
            );
        }

        const alreadyReviewed = await ReviewModel.existsForOrderItem(
            dto.order_item_id
        );
        if (alreadyReviewed) {
            throw new AppError('This purchase has already been reviewed', 409);
        }
    } else {
        const hasPurchased = await ReviewModel.hasDeliveredPurchase(
            userId,
            productId
        );
        if (!hasPurchased) {
            throw new AppError(
                'You can only review products from a delivered order',
                403
            );
        }
    }

    const review = await ReviewModel.create(userId, productId, dto);
    res.status(201).json({ status: 'success', data: review });
};

/** PATCH /reviews/:id — chủ sở hữu sửa đánh giá của chính mình */
export const updateReview = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = reviewIdSchema.parse(req.params.id);

    const existing = await ReviewModel.findById(id);
    if (!existing || existing.user_id !== userId) {
        throw new AppError('Review not found', 404);
    }

    const dto = updateReviewSchema.parse(req.body);
    const review = await ReviewModel.update(id, dto);

    res.json({ status: 'success', data: review });
};

/** DELETE /reviews/:id — chủ sở hữu hoặc admin */
export const deleteReview = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const isAdmin = req.user?.role === 'admin';
    const id = reviewIdSchema.parse(req.params.id);

    const existing = await ReviewModel.findById(id);
    if (!existing || (!isAdmin && existing.user_id !== userId)) {
        throw new AppError('Review not found', 404);
    }

    await ReviewModel.delete(id);
    res.status(204).send();
};

/** PATCH /admin/reviews/:id/approve — duyệt hoặc gỡ duyệt */
export const approveReview = async (req: Request, res: Response) => {
    const id = reviewIdSchema.parse(req.params.id);
    const { is_approved } = approveReviewSchema.parse(req.body);

    const existing = await ReviewModel.findById(id);
    if (!existing) throw new AppError('Review not found', 404);

    const review = await ReviewModel.setApproved(id, is_approved);
    res.json({ status: 'success', data: review });
};
