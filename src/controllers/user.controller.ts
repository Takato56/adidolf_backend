import { type Request, type Response } from 'express';
import { AppError } from '../middleware/error.middleware.js';

export const getProfile = async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw new AppError('Unauthorized - User context not found', 401);
    }

    const { password, password_hash, passwordHash, secretKey, ...cleanUser } =
        user as any;

    res.json({
        status: 'success',
        data: cleanUser
    });
};
