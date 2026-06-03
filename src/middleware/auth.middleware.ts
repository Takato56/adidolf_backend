import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from './error.middleware';
import { verifyToken, type TokenPayload } from '../services/auth.service.js';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.slice(7);
    try {
        req.user = verifyToken(token, 'access');
        next();
    } catch {
        throw new AppError('Unauthorized', 401);
    }
};
