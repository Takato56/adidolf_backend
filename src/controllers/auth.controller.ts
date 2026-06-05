import { type Request, type Response } from 'express';
import UserModel from '../models/user.model.js';
import RefreshTokenModel from '../models/refreshToken.model.js';
import { supabase } from '../config/database/supabase.config';
import { AppError } from '../middleware/error.middleware.js';
import {
    hashPassword,
    comparePassword,
    generateTokens,
    verifyToken
} from '../utils/auth.utils.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
};

export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        const messages = parsed.error.issues.map((e) => e.message).join(', ');
        throw new AppError(messages, 400);
    }

    const { email, password, full_name, phone } = parsed.data;

    const existing = await UserModel.findByEmail(email);
    if (existing) throw new AppError('Email already in use', 409);

    const password_hash = await hashPassword(password);

    const { data, error } = await supabase
        .from('users')
        .insert({ email, password_hash, full_name, phone })
        .select('user_id, email, full_name, phone, role, is_active, created_at')
        .single();

    if (error) throw new AppError(error.message, 500);

    res.status(201).json({ status: 'success', data });
};

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        const messages = parsed.error.issues.map((e) => e.message).join(', ');
        throw new AppError(messages, 400);
    }

    const { email, password } = parsed.data;

    const user = await UserModel.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens({
        userId: user.user_id,
        email: user.email,
        role: user.role
    });

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);

    // Store refresh token in MongoDB
    await RefreshTokenModel.create({
        userId: user.user_id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Match COOKIE_OPTIONS.maxAge
    });

    res.json({
        status: 'success',
        data: {
            accessToken,
            user: {
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        }
    });
};

export const refresh = async (req: Request, res: Response) => {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new AppError('No refresh token', 401);

    let payload;
    try {
        payload = verifyToken(token, 'refresh');

        // Check if token exists in MongoDB
        const storedToken = await RefreshTokenModel.findOne({ token });
        if (!storedToken) {
            throw new Error('Token not found in database');
        }
    } catch {
        await RefreshTokenModel.deleteOne({ token });
        res.clearCookie(REFRESH_COOKIE, { path: '/' });
        throw new AppError('Refresh token expired or invalid', 403);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    });

    // Replace old token with new one in MongoDB (Token Rotation)
    await RefreshTokenModel.deleteOne({ token });
    await RefreshTokenModel.create({
        userId: payload.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    res.json({ status: 'success', data: { accessToken } });
};

export const logout = async (req: Request, res: Response) => {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
    if (token) {
        await RefreshTokenModel.deleteOne({ token });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.json({ status: 'success', message: 'Logged out' });
};
