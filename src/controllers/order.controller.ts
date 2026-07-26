import { type Request, type Response } from 'express';
import OrderModel from '../models/order.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    createOrderSchema,
    listOrdersSchema,
    orderIdParamSchema
} from '../validators/order.validator.js';

/** Lấy người dùng đã xác thực từ middleware, không tin dữ liệu client gửi lên. */
const requireUser = (req: Request) => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return {
        userId: Number(req.user.userId),
        isAdmin: req.user.role === 'admin'
    };
};

/** POST /orders — tạo đơn từ giỏ hàng hiện tại */
export const createOrder = async (req: Request, res: Response) => {
    const { userId } = requireUser(req);
    const dto = createOrderSchema.parse(req.body);

    const orderId = await OrderModel.createFromCart(userId, dto);
    const order = await OrderModel.findByIdForUser(orderId, userId, false);

    res.status(201).json({ status: 'success', data: order });
};

/** GET /orders — danh sách đơn của chính mình */
export const listMyOrders = async (req: Request, res: Response) => {
    const { userId } = requireUser(req);
    const query = listOrdersSchema.parse(req.query);

    const { rows, total } = await OrderModel.findMine(userId, query);

    res.json({
        status: 'success',
        data: rows,
        meta: { total, limit: query.limit, offset: query.offset }
    });
};

/** GET /orders/:id — chi tiết đơn, quyền sở hữu kiểm tra ở tầng CSDL */
export const getOrderById = async (req: Request, res: Response) => {
    const { userId, isAdmin } = requireUser(req);
    const { id } = orderIdParamSchema.parse(req.params);

    const order = await OrderModel.findByIdForUser(id, userId, isAdmin);

    res.json({ status: 'success', data: order });
};

/** PATCH /orders/:id/cancel — hủy đơn ở trạng thái pending hoặc confirmed */
export const cancelOrder = async (req: Request, res: Response) => {
    const { userId, isAdmin } = requireUser(req);
    const { id } = orderIdParamSchema.parse(req.params);

    await OrderModel.cancel(id, userId, isAdmin);
    const order = await OrderModel.findByIdForUser(id, userId, isAdmin);

    res.json({ status: 'success', data: order });
};
