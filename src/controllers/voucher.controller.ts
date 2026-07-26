import { type Request, type Response } from 'express';
import CartModel from '../models/cart.model.js';
import VoucherModel from '../models/voucher.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { evaluateVoucher } from '../services/voucher.service.js';
import { validateVoucherSchema } from '../validators/voucher.validator.js';
import type { VoucherEvaluation } from '../types/voucher.types.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_PRIMARY_KEY = 'voucher_id';
const ADMIN_ALLOWED_FIELDS = [
    'code',
    'discount_type',
    'discount_value',
    'max_discount',
    'min_order_amount',
    'usage_limit',
    'used_count',
    'valid_from',
    'valid_to',
    'is_active',
    'target_user_id'
] as const;
const ADMIN_REQUIRED_CREATE_FIELDS = [
    'code',
    'discount_type',
    'discount_value',
    'valid_from',
    'valid_to'
] as const;
const ADMIN_FILTER_FIELDS = ['code', 'discount_type', 'is_active', 'target_user_id'] as const;

/** GET /admin/vouchers — CRUD chung cho trang quản trị. */
export const listAdminVouchers = async (req: Request, res: Response) => {
    const records = await VoucherModel.adminFindAll({
        filters: collectFilters(req, ADMIN_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminVoucherById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const record = await VoucherModel.adminFindById(id);
    if (!record) throw new AppError('vouchers record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminVoucher = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_REQUIRED_CREATE_FIELDS);

    const record = await VoucherModel.adminCreate(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminVoucher = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await VoucherModel.adminFindById(id);
    if (!existing) throw new AppError('vouchers record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await VoucherModel.adminUpdate(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminVoucher = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await VoucherModel.adminFindById(id);
    if (!existing) throw new AppError('vouchers record not found', 404);

    await VoucherModel.adminDelete(id);
    res.status(204).send();
};

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
