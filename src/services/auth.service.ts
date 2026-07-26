import UserModel from '../models/user.model.js';
import RefreshTokenModel from '../models/userToken.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    comparePassword,
    generateTokens,
    hashPassword,
    verifyToken
} from '../utils/auth.utils.js';
import { env } from '../config/env.config.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import type { PublicUser } from '../types/user.types.js';
import type { TokenPayload } from '../types/auth.types.js';

export interface AuthTokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthenticatedUser {
    email: string;
    full_name: string;
    role: string;
}

const refreshTokenExpiry = (): Date =>
    new Date(Date.now() + env.REFRESH_TOKEN_MAX_AGE);

/** POST /auth/register — tạo tài khoản customer, mật khẩu băm bằng Argon2. */
export const registerUser = async (
    dto: RegisterInput
): Promise<PublicUser> => {
    const existing = await UserModel.findByEmail(dto.email);
    if (existing) throw new AppError('Email already in use', 409);

    const password_hash = await hashPassword(dto.password);

    return UserModel.create({
        email: dto.email,
        password_hash,
        full_name: dto.full_name,
        phone: dto.phone
    });
};

/**
 * POST /auth/login — xác thực bằng Argon2, phát cặp token, lưu refresh
 * token vào DB, và dọn các refresh token đã hết hạn của mọi tài khoản.
 */
export const loginUser = async (
    dto: LoginInput
): Promise<{ tokens: AuthTokenPair; user: AuthenticatedUser }> => {
    const user = await UserModel.findByEmail(dto.email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const isValidPassword = await comparePassword(
        dto.password,
        user.password_hash
    );
    if (!isValidPassword) throw new AppError('Invalid credentials', 401);

    await RefreshTokenModel.deleteExpired();

    const tokens = generateTokens({
        userId: user.user_id,
        email: user.email,
        role: user.role
    });

    await RefreshTokenModel.create({
        userId: user.user_id,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry()
    });

    return {
        tokens,
        user: {
            email: user.email,
            full_name: user.full_name,
            role: user.role
        }
    };
};

/**
 * Xác minh chữ ký JWT rồi đối chiếu với bản ghi trong DB. Trả về `null`
 * cho bất kỳ lý do không hợp lệ nào (chữ ký sai/hết hạn, không có trong
 * DB, hoặc đã hết hạn trong DB) thay vì ném lỗi để bắt lại ngay trong
 * cùng phạm vi — tránh cảnh báo "throw of exception caught locally".
 */
const verifyStoredRefreshToken = async (
    token: string
): Promise<TokenPayload | null> => {
    let payload: TokenPayload;
    try {
        payload = verifyToken(token, 'refresh');
    } catch {
        return null;
    }

    const storedToken = await RefreshTokenModel.findOne({ token });
    if (!storedToken) return null;

    if (
        storedToken.expired_in &&
        new Date(storedToken.expired_in).getTime() <= Date.now()
    ) {
        return null;
    }

    return payload;
};

/**
 * POST /auth/refresh — xoay vòng refresh token: xác minh chữ ký, đối
 * chiếu với bản ghi trong DB, xóa token cũ và phát cặp token mới. Bất kỳ
 * bước kiểm tra nào thất bại đều xóa luôn token cũ (nếu có) rồi báo lỗi
 * thống nhất, tránh lộ chi tiết lý do thất bại. Nhân tiện dọn các token
 * đã hết hạn trong bảng.
 */
export const refreshTokens = async (
    token: string | undefined
): Promise<AuthTokenPair> => {
    if (!token) throw new AppError('No refresh token', 401);

    const payload = await verifyStoredRefreshToken(token);
    if (!payload) {
        await RefreshTokenModel.deleteOne({ token });
        throw new AppError('Refresh token expired or invalid', 403);
    }

    await RefreshTokenModel.deleteExpired();

    const tokens = generateTokens({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    });

    // Xoay vòng: xóa token cũ trước khi chèn token mới.
    await RefreshTokenModel.deleteOne({ token });
    await RefreshTokenModel.create({
        userId: payload.userId,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry()
    });

    return tokens;
};

/** POST /auth/logout — hủy đúng refresh token hiện tại (nếu có). */
export const logoutUser = async (token: string | undefined): Promise<void> => {
    if (token) {
        await RefreshTokenModel.deleteOne({ token });
    }
};

/** POST /auth/logout-all — hủy toàn bộ refresh token của tài khoản. */
export const logoutAllUser = async (userId: number): Promise<void> => {
    await RefreshTokenModel.deleteAllForUser(userId);
};
