import { type Request, type Response } from 'express';
import AddressModel from '../models/address.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    addressIdParamSchema,
    createAddressSchema,
    updateAddressSchema
} from '../validators/address.validator.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_PRIMARY_KEY = 'address_id';
const ADMIN_ALLOWED_FIELDS = [
    'user_id',
    'recipient_name',
    'phone',
    'is_default',
    'address_details'
] as const;
const ADMIN_REQUIRED_CREATE_FIELDS = [
    'user_id',
    'recipient_name',
    'phone',
    'address_details'
] as const;
const ADMIN_FILTER_FIELDS = ['user_id', 'is_default'] as const;

/** GET /admin/addresses — mọi địa chỉ trong hệ thống, dùng cho trang quản trị. */
export const listAdminAddresses = async (req: Request, res: Response) => {
    const records = await AddressModel.adminFindAll({
        filters: collectFilters(req, ADMIN_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminAddressById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const record = await AddressModel.findById(id);
    if (!record) throw new AppError('addresses record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminAddress = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_REQUIRED_CREATE_FIELDS);

    const record = await AddressModel.adminCreate(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminAddress = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await AddressModel.findById(id);
    if (!existing) throw new AppError('addresses record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await AddressModel.adminUpdate(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminAddress = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await AddressModel.findById(id);
    if (!existing) throw new AppError('addresses record not found', 404);

    await AddressModel.delete(id);
    res.status(204).send();
};

/** Lấy userId đã xác thực từ middleware, không tin dữ liệu client gửi lên. */
const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

/**
 * Trả về 404 thay vì 403 khi địa chỉ không tồn tại hoặc không thuộc về
 * người dùng — tránh lộ việc bản ghi đó có tồn tại hay không.
 */
const getOwnAddressOrThrow = async (id: number, userId: number) => {
    const address = await AddressModel.findById(id);
    if (!address || address.user_id !== userId) {
        throw new AppError('Address not found', 404);
    }
    return address;
};

/** GET /user/addresses — danh sách địa chỉ của chính mình */
export const listMyAddresses = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const addresses = await AddressModel.findAllByUser(userId);

    res.json({ status: 'success', data: addresses });
};

/** POST /user/addresses — thêm địa chỉ */
export const createAddress = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const dto = createAddressSchema.parse(req.body);

    const address = await AddressModel.create(userId, dto);
    res.status(201).json({ status: 'success', data: address });
};

/** PUT /user/addresses/:id — sửa địa chỉ, kiểm tra quyền sở hữu */
export const updateAddress = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = addressIdParamSchema.parse(req.params.id);
    await getOwnAddressOrThrow(id, userId);

    const dto = updateAddressSchema.parse(req.body);
    const address = await AddressModel.update(id, userId, dto);

    res.json({ status: 'success', data: address });
};

/** DELETE /user/addresses/:id — chặn nếu đang được đơn hàng tham chiếu */
export const deleteAddress = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = addressIdParamSchema.parse(req.params.id);
    await getOwnAddressOrThrow(id, userId);

    const referenced = await AddressModel.isReferencedByOrder(id);
    if (referenced) {
        throw new AppError(
            'Cannot delete address: it is referenced by an existing order',
            400
        );
    }

    await AddressModel.delete(id);
    res.status(204).send();
};

/** PATCH /user/addresses/:id/default — đặt mặc định, bỏ mặc định các địa chỉ khác */
export const setDefaultAddress = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = addressIdParamSchema.parse(req.params.id);
    await getOwnAddressOrThrow(id, userId);

    const address = await AddressModel.setDefault(id, userId);
    res.json({ status: 'success', data: address });
};
