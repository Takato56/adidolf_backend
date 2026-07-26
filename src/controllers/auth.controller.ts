import { type Request, type Response } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import { env } from '../config/env.config.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import * as AuthService from '../services/auth.service.js';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'none' as const,
    maxAge: env.REFRESH_TOKEN_MAX_AGE,
    path: '/'
};

const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

export const register = async (req: Request, res: Response) => {
    const dto = registerSchema.parse(req.body);
    const user = await AuthService.registerUser(dto);

    res.status(201).json({ status: 'success', user });
};

export const login = async (req: Request, res: Response) => {
    const dto = loginSchema.parse(req.body);
    const { tokens, user } = await AuthService.loginUser(dto);

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.json({
        status: 'success',
        data: { accessToken: tokens.accessToken, user }
    });
};

export const refresh = async (req: Request, res: Response) => {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE];

    try {
        const tokens = await AuthService.refreshTokens(token);
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
        res.json({
            status: 'success',
            data: { accessToken: tokens.accessToken }
        });
    } catch (error) {
        res.clearCookie(REFRESH_COOKIE, { path: '/' });
        throw error;
    }
};

export const logout = async (req: Request, res: Response) => {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
    await AuthService.logoutUser(token);

    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.json({ status: 'success', message: 'Logged out' });
};

export const logoutAll = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    await AuthService.logoutAllUser(userId);

    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.json({ status: 'success', message: 'Logged out from all devices' });
};
