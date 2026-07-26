import { type Request, type Response } from 'express';
import CartModel from '../models/cart.model.js';
import VoucherModel from '../models/voucher.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { evaluateVoucher } from '../services/voucher.service.js';
import { validateVoucherSchema } from '../validators/voucher.validator.js';
import type { VoucherEvaluation } from '../types/voucher.types.js';

const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

/**
 * POST /vouchers/validate — nhận { code }, tự tính subtotal từ giỏ hàng
 * hiện tại của người dùng (không nhận số tiền từ client), trả về kết quả
 * đánh giá voucher. Mã không tồn tại/hết hạn/không đủ điều kiện đều trả
 * về HTTP 200 với { valid: false, reason } thay vì lỗi, vì đây là endpoint
 * "kiểm tra" chứ không phải hành động ghi dữ liệu.
 */
export const validateVoucher = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { code } = validateVoucherSchema.parse(req.body);

    const cart = await CartModel.findOrCreateByUserId(userId);
    const { subtotal } = await CartModel.getSummary(cart.cart_id);

    const voucher = await VoucherModel.findByCode(code);
    if (!voucher) {
        const result: VoucherEvaluation = {
            valid: false,
            discount_amount: 0,
            reason: 'Voucher code not found'
        };
        res.json({ status: 'success', data: result });
        return;
    }

    const usedCountByUser = await VoucherModel.countRedemptionsByUser(
        voucher.voucher_id,
        userId
    );
    const result = evaluateVoucher(voucher, subtotal, userId, usedCountByUser);

    res.json({ status: 'success', data: result });
};
