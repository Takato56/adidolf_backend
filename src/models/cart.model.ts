import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import {
    calculateLineSubtotal,
    calculateUnitPrice,
    pickPrimaryImage
} from '../utils/cart.utils.js';
import type {
    Cart,
    CartItemRow,
    CartItemWithDetails,
    CartSummary
} from '../types/cart.types.js';

const cartItemSelect = `
    cart_item_id, cart_id, product_id, variant_id, quantity, added_at,
    product:products(product_id, name, slug, base_price, is_published,
        images:product_images(image_url, is_primary, sort_order)),
    variant:product_variants(variant_id, sku, color, size, extra_price, stock_quantity, image_url)
`;

type CartItemQueryRow = {
    cart_item_id: number;
    cart_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    added_at: string;
    product: {
        product_id: number;
        name: string;
        slug: string;
        base_price: number;
        is_published: boolean;
        images?: { image_url: string; is_primary: boolean; sort_order: number }[];
    };
    variant: {
        variant_id: number;
        sku: string;
        color: string | null;
        size: string | null;
        extra_price: number;
        stock_quantity: number;
        image_url: string | null;
    } | null;
};

const normalizeItem = (row: CartItemQueryRow): CartItemWithDetails => {
    const unitPrice = calculateUnitPrice(
        row.product.base_price,
        row.variant?.extra_price ?? 0
    );

    return {
        cart_item_id: row.cart_item_id,
        product_id: row.product_id,
        variant_id: row.variant_id,
        quantity: row.quantity,
        added_at: row.added_at,
        unit_price: unitPrice,
        subtotal: calculateLineSubtotal(unitPrice, row.quantity),
        product: {
            product_id: row.product.product_id,
            name: row.product.name,
            slug: row.product.slug,
            base_price: Number(row.product.base_price),
            is_published: row.product.is_published,
            primary_image: pickPrimaryImage(row.product.images)
        },
        variant: row.variant
            ? {
                  variant_id: row.variant.variant_id,
                  sku: row.variant.sku,
                  color: row.variant.color,
                  size: row.variant.size,
                  extra_price: Number(row.variant.extra_price),
                  stock_quantity: row.variant.stock_quantity,
                  image_url: row.variant.image_url
              }
            : null
    };
};

const CartModel = {
    /** Lấy giỏ của người dùng, tự tạo giỏ rỗng nếu chưa có. */
    async findOrCreateByUserId(userId: number): Promise<Cart> {
        const { data: existing, error: findError } = await supabase
            .from('carts')
            .select('cart_id, user_id, created_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle();

        if (findError && !isSupabaseNotFound(findError)) {
            throw toDatabaseError(findError);
        }
        if (existing) return existing as Cart;

        const { data: created, error: createError } = await supabase
            .from('carts')
            .insert({ user_id: userId })
            .select('cart_id, user_id, created_at, updated_at')
            .single();

        if (createError) throw toDatabaseError(createError);
        return created as Cart;
    },

    /** Danh sách dòng hàng kèm sản phẩm/biến thể, đơn giá và tổng tạm tính do server tính. */
    async getSummary(cartId: number): Promise<CartSummary> {
        const { data, error } = await supabase
            .from('cart_items')
            .select(cartItemSelect)
            .eq('cart_id', cartId)
            .order('added_at', { ascending: true });

        if (error) throw toDatabaseError(error);

        const items = ((data ?? []) as unknown as CartItemQueryRow[]).map(
            normalizeItem
        );
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

        return { cart_id: cartId, items, subtotal, total_items: totalItems };
    },

    /** Tìm dòng hàng theo id, đồng thời xác nhận thuộc đúng giỏ được truyền vào. */
    async findItemOwnedByCart(
        cartItemId: number,
        cartId: number
    ): Promise<CartItemRow | null> {
        const { data, error } = await supabase
            .from('cart_items')
            .select('cart_item_id, cart_id, product_id, variant_id, quantity')
            .eq('cart_item_id', cartItemId)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        if (!data || data.cart_id !== cartId) return null;

        return data as CartItemRow;
    },

    /** Tìm dòng hàng đã tồn tại cho cùng sản phẩm + biến thể trong giỏ, để cộng dồn số lượng. */
    async findExistingLine(
        cartId: number,
        productId: number,
        variantId: number
    ): Promise<{ cart_item_id: number; quantity: number } | null> {
        const { data, error } = await supabase
            .from('cart_items')
            .select('cart_item_id, quantity')
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .eq('variant_id', variantId)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async insertItem(
        cartId: number,
        productId: number,
        variantId: number,
        quantity: number
    ): Promise<void> {
        const { error } = await supabase.from('cart_items').insert({
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity
        });

        if (error) throw toDatabaseError(error);
    },

    async setItemQuantity(cartItemId: number, quantity: number): Promise<void> {
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('cart_item_id', cartItemId);

        if (error) throw toDatabaseError(error);
    },

    async deleteItem(cartItemId: number): Promise<void> {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_item_id', cartItemId);

        if (error) throw toDatabaseError(error);
    },

    async clear(cartId: number): Promise<void> {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartId);

        if (error) throw toDatabaseError(error);
    },

    /** Sản phẩm phải tồn tại và đang mở bán mới cho phép thêm vào giỏ. */
    async findPublishedProduct(
        productId: number
    ): Promise<{ product_id: number; is_published: boolean } | null> {
        const { data, error } = await supabase
            .from('products')
            .select('product_id, is_published')
            .eq('product_id', productId)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    /** Biến thể phải tồn tại và thuộc đúng sản phẩm được gửi lên. */
    async findVariantForProduct(
        variantId: number,
        productId: number
    ): Promise<{
        variant_id: number;
        product_id: number;
        stock_quantity: number;
        extra_price: number;
    } | null> {
        const { data, error } = await supabase
            .from('product_variants')
            .select('variant_id, product_id, stock_quantity, extra_price')
            .eq('variant_id', variantId)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        if (!data || data.product_id !== productId) return null;

        return data;
    }
};

export default CartModel;
