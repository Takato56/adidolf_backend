import { type Request, type Response } from 'express';
import OrderModel from '../models/order.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    createOrderSchema,
    listOrdersSchema,
    orderIdParamSchema
} from '../validators/order.validator.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_ORDER_PRIMARY_KEY = 'order_id';
const ADMIN_ORDER_ALLOWED_FIELDS = [
    'user_id',
    'address_id',
    'voucher_id',
    'status',
    'subtotal',
    'discount_amount',
    'shipping_fee',
    'total_price',
    'note'
] as const;
const ADMIN_ORDER_REQUIRED_CREATE_FIELDS = [
    'user_id',
    'address_id',
    'subtotal',
    'total_price'
] as const;
const ADMIN_ORDER_FILTER_FIELDS = ['user_id', 'address_id', 'voucher_id', 'status'] as const;
const ADMIN_ORDER_UPDATED_AT_COLUMN = 'updated_at';

const ADMIN_ORDER_ITEM_PRIMARY_KEY = 'item_id';
const ADMIN_ORDER_ITEM_ALLOWED_FIELDS = [
    'order_id',
    'product_id',
    'variant_id',
    'product_name',
    'variant_info',
    'unit_price',
    'quantity',
    'subtotal'
] as const;
const ADMIN_ORDER_ITEM_REQUIRED_CREATE_FIELDS = [
    'order_id',
    'product_id',
    'product_name',
    'unit_price',
    'quantity',
    'subtotal'
] as const;
const ADMIN_ORDER_ITEM_FILTER_FIELDS = ['order_id', 'product_id', 'variant_id'] as const;

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

/** GET /admin/orders — mọi đơn hàng trong hệ thống, dùng cho trang quản trị. */
export const listAdminOrders = async (req: Request, res: Response) => {
    const records = await OrderModel.adminFindAllOrders({
        filters: collectFilters(req, ADMIN_ORDER_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminOrderById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_PRIMARY_KEY);
    const record = await OrderModel.adminFindByIdOrder(id);
    if (!record) throw new AppError('orders record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminOrder = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ORDER_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_ORDER_REQUIRED_CREATE_FIELDS);

    const record = await OrderModel.adminCreateOrder(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminOrder = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_PRIMARY_KEY);
    const existing = await OrderModel.adminFindByIdOrder(id);
    if (!existing) throw new AppError('orders record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ORDER_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    payload[ADMIN_ORDER_UPDATED_AT_COLUMN] = new Date().toISOString();

    const record = await OrderModel.adminUpdateOrder(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminOrder = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_PRIMARY_KEY);
    const existing = await OrderModel.adminFindByIdOrder(id);
    if (!existing) throw new AppError('orders record not found', 404);

    await OrderModel.adminDeleteOrder(id);
    res.status(204).send();
};

/** GET /admin/order-items — mọi dòng hàng trong mọi đơn, dùng cho trang quản trị. */
export const listAdminOrderItems = async (req: Request, res: Response) => {
    const records = await OrderModel.adminFindAllOrderItems({
        filters: collectFilters(req, ADMIN_ORDER_ITEM_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminOrderItemById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_ITEM_PRIMARY_KEY);
    const record = await OrderModel.adminFindByIdOrderItem(id);
    if (!record) throw new AppError('order_items record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminOrderItem = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ORDER_ITEM_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_ORDER_ITEM_REQUIRED_CREATE_FIELDS);

    const record = await OrderModel.adminCreateOrderItem(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminOrderItem = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_ITEM_PRIMARY_KEY);
    const existing = await OrderModel.adminFindByIdOrderItem(id);
    if (!existing) throw new AppError('order_items record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ORDER_ITEM_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await OrderModel.adminUpdateOrderItem(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminOrderItem = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_ORDER_ITEM_PRIMARY_KEY);
    const existing = await OrderModel.adminFindByIdOrderItem(id);
    if (!existing) throw new AppError('order_items record not found', 404);

    await OrderModel.adminDeleteOrderItem(id);
    res.status(204).send();
};
