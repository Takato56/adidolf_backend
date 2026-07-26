import { type Request, type Response } from 'express';
import ShipmentModel from '../models/shipment.model.js';
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

const RESOURCE_LABEL = 'shipments';
const PRIMARY_KEY = 'shipment_id';
const ALLOWED_CREATE_FIELDS = [
    'order_id',
    'carrier',
    'tracking_number',
    'status',
    'shipped_at',
    'estimated_delivery',
    'delivered_at'
] as const;
const ALLOWED_UPDATE_FIELDS = ALLOWED_CREATE_FIELDS;
const REQUIRED_CREATE_FIELDS = ['order_id', 'carrier'] as const;
const FILTER_FIELDS = ['order_id', 'carrier', 'tracking_number', 'status'] as const;

export const listShipments = async (req: Request, res: Response) => {
    const records = await ShipmentModel.findAll({
        filters: collectFilters(req, FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getShipmentById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const record = await ShipmentModel.findById(id);
    if (!record) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    res.json({ status: 'success', data: record });
};

export const createShipment = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);
    assertRequiredFields(payload, REQUIRED_CREATE_FIELDS);

    const record = await ShipmentModel.create(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateShipment = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await ShipmentModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    const payload = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await ShipmentModel.update(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteShipment = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, PRIMARY_KEY);
    const existing = await ShipmentModel.findById(id);
    if (!existing) throw new AppError(`${RESOURCE_LABEL} record not found`, 404);

    await ShipmentModel.delete(id);
    res.status(204).send();
};
