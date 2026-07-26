import { type Request, type Response } from 'express';
import AddressModel from '../models/address.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    addressIdParamSchema,
    createAddressSchema,
    updateAddressSchema
} from '../validators/address.validator.js';

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
