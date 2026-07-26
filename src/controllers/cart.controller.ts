import { type Request, type Response } from 'express';
import CartModel from '../models/cart.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    addCartItemSchema,
    cartItemIdParamSchema,
    updateCartItemQuantitySchema
} from '../validators/cart.validator.js';

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
