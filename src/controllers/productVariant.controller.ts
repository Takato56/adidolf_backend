import { type Request, type Response } from 'express';
import ProductVariantModel from '../models/productVariant.model.js';
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

const RESOURCE_LABEL = 'product_variants';
const PRIMARY_KEY = 'variant_id';
const ALLOWED_CREATE_FIELDS = [
    'product_id',
    'sku',
    'color',
    'size',
    'extra_price',
    'stock_quantity',
    'image_url'
] as const;
const ALLOWED_UPDATE_FIELDS = ALLOWED_CREATE_FIELDS;
const REQUIRED_CREATE_FIELDS = ['product_id', 'sku'] as const;
const FILTER_FIELDS = ['product_id', 'sku', 'color', 'size'] as const;

export const listProductVariants = async (req: Request, res: Response) => {
    const records = await ProductVariantModel.findAll({
        filters: collectFilters(req, FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getProductVariantById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const record = await ProductVariantModel.findById(id);
    if (!record) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    res.json({ status: 'success', data: record });
};

export const createProductVariant = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);
    assertRequiredFields(payload, REQUIRED_CREATE_FIELDS);

    const record = await ProductVariantModel.create(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateProductVariant = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await ProductVariantModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    const payload = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await ProductVariantModel.update(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteProductVariant = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await ProductVariantModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    await ProductVariantModel.delete(id);
    res.status(204).send();
};
