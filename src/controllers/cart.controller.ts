import { type Request, type Response } from 'express';
import CartModel from '../models/cart.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    addCartItemSchema,
    cartItemIdParamSchema,
    updateCartItemQuantitySchema
} from '../validators/cart.validator.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_CART_PRIMARY_KEY = 'cart_id';
const ADMIN_CART_ALLOWED_FIELDS = ['user_id'] as const;
const ADMIN_CART_REQUIRED_CREATE_FIELDS = [] as const;
const ADMIN_CART_FILTER_FIELDS = ['user_id'] as const;
const ADMIN_CART_UPDATED_AT_COLUMN = 'updated_at';

const ADMIN_CART_ITEM_PRIMARY_KEY = 'cart_item_id';
const ADMIN_CART_ITEM_ALLOWED_FIELDS = [
    'cart_id',
    'product_id',
    'variant_id',
    'quantity'
] as const;
const ADMIN_CART_ITEM_REQUIRED_CREATE_FIELDS = ['cart_id', 'product_id'] as const;
const ADMIN_CART_ITEM_FILTER_FIELDS = ['cart_id', 'product_id', 'variant_id'] as const;

/** Lấy userId đã xác thực từ middleware, không tin dữ liệu client gửi lên. */
const requireUserId = (req: Request): number => {
    if (!req.user) throw new AppError('Unauthorized', 401);
    return Number(req.user.userId);
};

const getOwnCart = (userId: number) => CartModel.findOrCreateByUserId(userId);

const assertStockAvailable = (
    requestedQuantity: number,
    stockQuantity: number
): void => {
    if (requestedQuantity > stockQuantity) {
        throw new AppError(
            `Chỉ còn ${stockQuantity} sản phẩm trong kho`,
            400
        );
    }
};

/** GET /cart — lấy giỏ hiện tại, tự tạo giỏ rỗng nếu chưa có */
export const getCart = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const cart = await getOwnCart(userId);
    const summary = await CartModel.getSummary(cart.cart_id);

    res.json({ status: 'success', data: summary });
};

/** POST /cart/items — thêm dòng hàng, cộng dồn số lượng nếu đã tồn tại */
export const addCartItem = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const dto = addCartItemSchema.parse(req.body);
    const cart = await getOwnCart(userId);

    const product = await CartModel.findPublishedProduct(dto.product_id);
    if (!product || !product.is_published) {
        throw new AppError('Product not found', 404);
    }

    const variant = await CartModel.findVariantForProduct(
        dto.variant_id,
        dto.product_id
    );
    if (!variant) {
        throw new AppError('Product variant not found', 404);
    }

    const existing = await CartModel.findExistingLine(
        cart.cart_id,
        dto.product_id,
        dto.variant_id
    );
    const desiredQuantity = (existing?.quantity ?? 0) + dto.quantity;
    assertStockAvailable(desiredQuantity, variant.stock_quantity);

    if (existing) {
        await CartModel.setItemQuantity(existing.cart_item_id, desiredQuantity);
    } else {
        await CartModel.insertItem(
            cart.cart_id,
            dto.product_id,
            dto.variant_id,
            dto.quantity
        );
    }

    const summary = await CartModel.getSummary(cart.cart_id);
    res.status(201).json({ status: 'success', data: summary });
};

/** PATCH /cart/items/:itemId — cập nhật số lượng tuyệt đối cho một dòng hàng */
export const updateCartItemQuantity = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const { quantity } = updateCartItemQuantitySchema.parse(req.body);
    const cart = await getOwnCart(userId);

    const item = await CartModel.findItemOwnedByCart(itemId, cart.cart_id);
    if (!item || item.variant_id === null) {
        throw new AppError('Cart item not found', 404);
    }

    const variant = await CartModel.findVariantForProduct(
        item.variant_id,
        item.product_id
    );
    if (!variant) throw new AppError('Product variant not found', 404);

    assertStockAvailable(quantity, variant.stock_quantity);
    await CartModel.setItemQuantity(itemId, quantity);

    const summary = await CartModel.getSummary(cart.cart_id);
    res.json({ status: 'success', data: summary });
};

/** DELETE /cart/items/:itemId — xóa một dòng hàng khỏi giỏ của chính mình */
export const removeCartItem = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const cart = await getOwnCart(userId);

    const item = await CartModel.findItemOwnedByCart(itemId, cart.cart_id);
    if (!item) throw new AppError('Cart item not found', 404);

    await CartModel.deleteItem(itemId);

    const summary = await CartModel.getSummary(cart.cart_id);
    res.json({ status: 'success', data: summary });
};

/** DELETE /cart — xóa sạch giỏ hàng của chính mình */
export const clearCart = async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const cart = await getOwnCart(userId);

    await CartModel.clear(cart.cart_id);

    res.json({
        status: 'success',
        data: { cart_id: cart.cart_id, items: [], subtotal: 0, total_items: 0 }
    });
};

/** GET /admin/carts — mọi giỏ hàng trong hệ thống, dùng cho trang quản trị. */
export const listAdminCarts = async (req: Request, res: Response) => {
    const records = await CartModel.adminFindAllCarts({
        filters: collectFilters(req, ADMIN_CART_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminCartById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_PRIMARY_KEY);
    const record = await CartModel.adminFindByIdCart(id);
    if (!record) throw new AppError('carts record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminCart = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_CART_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_CART_REQUIRED_CREATE_FIELDS);

    const record = await CartModel.adminCreateCart(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminCart = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_PRIMARY_KEY);
    const existing = await CartModel.adminFindByIdCart(id);
    if (!existing) throw new AppError('carts record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_CART_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    payload[ADMIN_CART_UPDATED_AT_COLUMN] = new Date().toISOString();

    const record = await CartModel.adminUpdateCart(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminCart = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_PRIMARY_KEY);
    const existing = await CartModel.adminFindByIdCart(id);
    if (!existing) throw new AppError('carts record not found', 404);

    await CartModel.adminDeleteCart(id);
    res.status(204).send();
};

/** GET /admin/cart-items — mọi dòng hàng trong mọi giỏ, dùng cho trang quản trị. */
export const listAdminCartItems = async (req: Request, res: Response) => {
    const records = await CartModel.adminFindAllCartItems({
        filters: collectFilters(req, ADMIN_CART_ITEM_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminCartItemById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_ITEM_PRIMARY_KEY);
    const record = await CartModel.adminFindByIdCartItem(id);
    if (!record) throw new AppError('cart_items record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminCartItem = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_CART_ITEM_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_CART_ITEM_REQUIRED_CREATE_FIELDS);

    const record = await CartModel.adminCreateCartItem(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminCartItem = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_ITEM_PRIMARY_KEY);
    const existing = await CartModel.adminFindByIdCartItem(id);
    if (!existing) throw new AppError('cart_items record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_CART_ITEM_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await CartModel.adminUpdateCartItem(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminCartItem = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_CART_ITEM_PRIMARY_KEY);
    const existing = await CartModel.adminFindByIdCartItem(id);
    if (!existing) throw new AppError('cart_items record not found', 404);

    await CartModel.deleteItem(id);
    res.status(204).send();
};
