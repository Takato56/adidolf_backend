import { type Request, type Response } from 'express';
import PaymentModel from '../models/payment.model.js';
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

const RESOURCE_LABEL = 'payments';
const PRIMARY_KEY = 'payment_id';
const ALLOWED_CREATE_FIELDS = [
    'order_id',
    'method',
    'status',
    'amount',
    'transaction_id',
    'gateway_response',
    'paid_at'
] as const;
const ALLOWED_UPDATE_FIELDS = ALLOWED_CREATE_FIELDS;
const REQUIRED_CREATE_FIELDS = ['order_id', 'method', 'amount'] as const;
const FILTER_FIELDS = ['order_id', 'method', 'status', 'transaction_id'] as const;

export const listPayments = async (req: Request, res: Response) => {
    const records = await PaymentModel.findAll({
        filters: collectFilters(req, FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getPaymentById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const record = await PaymentModel.findById(id);
    if (!record) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    res.json({ status: 'success', data: record });
};

export const createPayment = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);
    assertRequiredFields(payload, REQUIRED_CREATE_FIELDS);

    const record = await PaymentModel.create(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updatePayment = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await PaymentModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    const payload = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await PaymentModel.update(id, payload);
    res.json({ status: 'success', data: record });
};

export const deletePayment = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await PaymentModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    await PaymentModel.delete(id);
    res.status(204).send();
};
