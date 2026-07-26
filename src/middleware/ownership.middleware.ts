import { type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../config/supabase.config.js';
import { AppError } from './error.middleware.js';
import { toDatabaseError } from '../utils/supabase-error.utils.js';

/**
 * Sinh middleware kiểm tra quyền sở hữu bản ghi.
 *
 * `idParam` vừa là tên tham số trên route (req.params[idParam]) vừa là tên
 * cột dùng để tra bản ghi trong `table` — vì vậy route phải khai báo tham số
 * trùng tên với cột khóa chính, ví dụ:
 *   router.get('/addresses/:address_id', requireOwnership('addresses', 'address_id'), ...)
 *
 * Admin luôn được bỏ qua kiểm tra.
 */
export const requireOwnership = (
    table: string,
    idParam: string,
    ownerColumn: string = 'user_id'
) => {
    return async (
        req: Request,
        _res: Response,
        next: NextFunction
    ): Promise<void> => {
        if (!req.user) throw new AppError('Unauthorized', 401);
        if (req.user.role === 'admin') {
            next();
            return;
        }

        const id = req.params[idParam];
        if (!id) throw new AppError(`Missing ${idParam}`, 400);

        const { data, error } = (await supabase
            .from(table)
            .select(ownerColumn)
            .eq(idParam, id)
            .maybeSingle()) as {
            data: Record<string, unknown> | null;
            error: { message: string; code?: string | null } | null;
        };

        if (error) throw toDatabaseError(error);
        if (!data) throw new AppError('Not found', 404);

        const owner = data[ownerColumn];
        if (String(owner) !== String(req.user.userId)) {
            throw new AppError('Forbidden', 403);
        }

        next();
    };
};
