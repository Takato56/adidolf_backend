import { type Request, type Response } from 'express';
import UserModel from '../models/user.model.js';
import UserTokenModel from '../models/userToken.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { comparePassword, hashPassword } from '../utils/auth.utils.js';
import {
    changePasswordSchema,
    updateProfileSchema
} from '../validators/user.validator.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_PRIMARY_KEY = 'user_id';
const ADMIN_ALLOWED_FIELDS = [
    'email',
    'full_name',
    'phone',
    'avatar_url',
    'role',
    'is_active'
] as const;
const ADMIN_REQUIRED_CREATE_FIELDS = ['email', 'full_name'] as const;
const ADMIN_FILTER_FIELDS = ['email', 'role', 'is_active'] as const;
const ADMIN_UPDATED_AT_COLUMN = 'updated_at';

/** GET /admin/users — mọi tài khoản, dùng cho trang quản trị. */
export const listAdminUsers = async (req: Request, res: Response) => {
    const records = await UserModel.adminFindAll({
        filters: collectFilters(req, ADMIN_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminUserById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const record = await UserModel.adminFindById(id);
    if (!record) throw new AppError('users record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminUser = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_REQUIRED_CREATE_FIELDS);

    const record = await UserModel.adminCreate(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminUser = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await UserModel.adminFindById(id);
    if (!existing) throw new AppError('users record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    payload[ADMIN_UPDATED_AT_COLUMN] = new Date().toISOString();

    const record = await UserModel.adminUpdate(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminUser = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await UserModel.adminFindById(id);
    if (!existing) throw new AppError('users record not found', 404);

    await UserModel.delete(String(id));
    res.status(204).send();
};

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
