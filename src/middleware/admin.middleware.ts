import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from './error.middleware.js';

export const adminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    if (req.user.role !== 'admin') throw new AppError('Access denied', 403);
    next();
};
