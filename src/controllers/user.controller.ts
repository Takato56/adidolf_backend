import { type Request, type Response } from 'express';
import UserModel from '../models/user.model.js';
import UserTokenModel from '../models/userToken.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { comparePassword, hashPassword } from '../utils/auth.utils.js';
import {
    changePasswordSchema,
    updateProfileSchema
} from '../validators/user.validator.js';

/** Lấy userId đã xác thực từ middleware, không tin dữ liệu client gửi lên. */
const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

/** GET /user/me — hồ sơ đầy đủ từ DB, không bao giờ lộ password_hash */
export const getProfile = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const user = await UserModel.findPublicById(userId);
    if (!user) throw new AppError('User not found', 404);

    res.json({ status: 'success', data: user });
};

/** PATCH /user/me — cập nhật full_name, phone, avatar_url */
export const updateProfile = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const dto = updateProfileSchema.parse(req.body);

    const user = await UserModel.updateProfile(userId, dto);
    res.json({ status: 'success', data: user });
};

/**
 * PATCH /user/me/password — xác minh mật khẩu cũ bằng Argon2, băm mật khẩu
 * mới rồi hủy toàn bộ refresh token hiện có của tài khoản.
 */
export const changePassword = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { old_password, new_password } = changePasswordSchema.parse(
        req.body
    );

    const user = await UserModel.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isValidOldPassword = await comparePassword(
        old_password,
        user.password_hash
    );
    if (!isValidOldPassword) {
        throw new AppError('Old password is incorrect', 401);
    }

    const passwordHash = await hashPassword(new_password);
    await UserModel.updatePasswordHash(userId, passwordHash);
    await UserTokenModel.deleteAllForUser(userId);

    res.json({ status: 'success', message: 'Password updated successfully' });
};
