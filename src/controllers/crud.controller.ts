import { type Request, type Response } from 'express';
import { createCrudModel } from '../models/crud.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    type CrudRecord,
    type CrudResourceConfig
} from '../types/crud.types.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseId = (raw: unknown, config: CrudResourceConfig): string | number => {
    if (typeof raw !== 'string' || raw === '') {
        throw new AppError(`Missing ${config.primaryKey}`, 400);
    }

    if (config.primaryKeyType === 'number') {
        const id = Number(raw);
        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError(`Invalid ${config.primaryKey}`, 400);
        }
        return id;
    }

    return raw;
};

const pickAllowedFields = (
    body: unknown,
    allowedFields: readonly string[]
): CrudRecord => {
    if (!isPlainObject(body))
        throw new AppError('Request body is required', 400);

    return allowedFields.reduce<CrudRecord>((payload, field) => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            payload[field] = body[field];
        }
        return payload;
    }, {});
};

const assertRequiredFields = (
    payload: CrudRecord,
    requiredFields: readonly string[] = []
): void => {
    const missing = requiredFields.filter((field) => {
        const value = payload[field];
        return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
        throw new AppError(
            `Missing required fields: ${missing.join(', ')}`,
            400
        );
    }
};

const parseLimit = (raw: unknown): number | undefined => {
    if (raw === undefined) return undefined;
    const limit = Number(raw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError('limit must be an integer between 1 and 100', 400);
    }
    return limit;
};

const parseOffset = (raw: unknown): number | undefined => {
    if (raw === undefined) return undefined;
    const offset = Number(raw);
    if (!Number.isInteger(offset) || offset < 0) {
        throw new AppError('offset must be a non-negative integer', 400);
    }
    return offset;
};

const parseOrder = (raw: unknown): boolean | undefined => {
    if (raw === undefined) return undefined;
    const value = String(raw).toLowerCase();
    if (value === 'asc') return true;
    if (value === 'desc') return false;
    throw new AppError('order must be asc or desc', 400);
};

const collectFilters = (
    req: Request,
    config: CrudResourceConfig
): Record<string, string> => {
    const filterFields = new Set(config.filterFields ?? []);
    const filters: Record<string, string> = {};

    filterFields.forEach((field) => {
        const value = req.query[field];
        if (typeof value === 'string' && value !== '') {
            filters[field] = value;
        }
    });

    return filters;
};

export const createCrudController = (config: CrudResourceConfig) => {
    const model = createCrudModel(config);

    return {
        list: async (req: Request, res: Response) => {
            const records = await model.findAll({
                filters: collectFilters(req, config),
                limit: parseLimit(req.query.limit),
                offset: parseOffset(req.query.offset),
                sort:
                    typeof req.query.sort === 'string'
                        ? req.query.sort
                        : undefined,
                ascending: parseOrder(req.query.order)
            });

            res.json({ status: 'success', data: records });
        },

        getById: async (req: Request, res: Response) => {
            const id = parseId(req.params.id, config);
            const record = await model.findById(id);
            if (!record)
                throw new AppError(`${config.name} record not found`, 404);

            res.json({ status: 'success', data: record });
        },

        create: async (req: Request, res: Response) => {
            const payload = pickAllowedFields(
                req.body,
                config.allowedCreateFields
            );
            assertRequiredFields(payload, config.requiredCreateFields);

            const record = await model.create(payload);
            res.status(201).json({ status: 'success', data: record });
        },

        update: async (req: Request, res: Response) => {
            const id = parseId(req.params.id, config);
            const existing = await model.findById(id);
            if (!existing)
                throw new AppError(`${config.name} record not found`, 404);

            const payload = pickAllowedFields(
                req.body,
                config.allowedUpdateFields
            );
            if (Object.keys(payload).length === 0) {
                throw new AppError('No valid fields provided for update', 400);
            }

            if (config.updatedAtColumn) {
                payload[config.updatedAtColumn] = new Date().toISOString();
            }

            const record = await model.update(id, payload);
            res.json({ status: 'success', data: record });
        },

        delete: async (req: Request, res: Response) => {
            const id = parseId(req.params.id, config);
            const existing = await model.findById(id);
            if (!existing)
                throw new AppError(`${config.name} record not found`, 404);

            await model.delete(id);
            res.status(204).send();
        }
    };
};
