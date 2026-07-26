import { type Request } from 'express';
import { AppError } from '../middleware/error.middleware.js';

export type AdminRecord = Record<string, unknown>;

export interface AdminListOptions {
    filters: Record<string, string>;
    limit?: number;
    offset?: number;
    sort?: string;
    ascending?: boolean;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Đọc và kiểm tra id số nguyên dương từ req.params.id. */
export const parseNumericId = (raw: unknown, label: string): number => {
    if (typeof raw !== 'string' || raw === '') {
        throw new AppError(`Missing ${label}`, 400);
    }

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Invalid ${label}`, 400);
    }
    return id;
};

/** Chỉ giữ lại các trường được phép ghi từ body — chặn mass assignment. */
export const pickAllowedFields = (
    body: unknown,
    allowedFields: readonly string[]
): AdminRecord => {
    if (!isPlainObject(body))
        throw new AppError('Request body is required', 400);

    return allowedFields.reduce<AdminRecord>((payload, field) => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            payload[field] = body[field];
        }
        return payload;
    }, {});
};

export const assertRequiredFields = (
    payload: AdminRecord,
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

export const parseLimit = (raw: unknown): number | undefined => {
    if (raw === undefined) return undefined;
    const limit = Number(raw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError('limit must be an integer between 1 and 100', 400);
    }
    return limit;
};

export const parseOffset = (raw: unknown): number | undefined => {
    if (raw === undefined) return undefined;
    const offset = Number(raw);
    if (!Number.isInteger(offset) || offset < 0) {
        throw new AppError('offset must be a non-negative integer', 400);
    }
    return offset;
};

export const parseOrder = (raw: unknown): boolean | undefined => {
    if (raw === undefined) return undefined;
    const value = String(raw).toLowerCase();
    if (value === 'asc') return true;
    if (value === 'desc') return false;
    throw new AppError('order must be asc or desc', 400);
};

/** Gom các query param khớp với danh sách trường lọc cho phép của bảng. */
export const collectFilters = (
    req: Request,
    filterFields: readonly string[]
): Record<string, string> => {
    const filters: Record<string, string> = {};

    filterFields.forEach((field) => {
        const value = req.query[field];
        if (typeof value === 'string' && value !== '') {
            filters[field] = value;
        }
    });

    return filters;
};
