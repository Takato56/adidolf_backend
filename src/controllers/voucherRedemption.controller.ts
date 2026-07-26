import { type Request, type Response } from 'express';
import VoucherRedemptionModel from '../models/voucherRedemption.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const RESOURCE_LABEL = 'voucher_redemptions';
const PRIMARY_KEY = 'redemption_id';
const ALLOWED_CREATE_FIELDS = [
    'voucher_id',
    'user_id',
    'order_id',
    'discount_amount'
] as const;
const ALLOWED_UPDATE_FIELDS = ALLOWED_CREATE_FIELDS;
const REQUIRED_CREATE_FIELDS = [
    'voucher_id',
    'user_id',
    'order_id',
    'discount_amount'
] as const;
const FILTER_FIELDS = ['voucher_id', 'user_id', 'order_id'] as const;

export const listVoucherRedemptions = async (req: Request, res: Response) => {
    const records = await VoucherRedemptionModel.findAll({
        filters: collectFilters(req, FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getVoucherRedemptionById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const record = await VoucherRedemptionModel.findById(id);
    if (!record) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    res.json({ status: 'success', data: record });
};

export const createVoucherRedemption = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);
    assertRequiredFields(payload, REQUIRED_CREATE_FIELDS);

    const record = await VoucherRedemptionModel.create(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateVoucherRedemption = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await VoucherRedemptionModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    const payload = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await VoucherRedemptionModel.update(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteVoucherRedemption = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await VoucherRedemptionModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    await VoucherRedemptionModel.delete(id);
    res.status(204).send();
};
