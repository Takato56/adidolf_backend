export interface Cart {
    cart_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
}

export interface CartItemRow {
    cart_item_id: number;
    cart_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
}

export interface CartItemProduct {
    product_id: number;
    name: string;
    slug: string;
    base_price: number;
    is_published: boolean;
    primary_image: string | null;
}

export interface CartItemVariant {
    variant_id: number;
    sku: string;
    color: string | null;
    size: string | null;
    extra_price: number;
    stock_quantity: number;
    image_url: string | null;
}

export interface CartItemWithDetails {
    cart_item_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    added_at: string;
    unit_price: number;
    subtotal: number;
    product: CartItemProduct;
    variant: CartItemVariant | null;
}

export interface CartSummary {
    cart_id: number;
    items: CartItemWithDetails[];
    subtotal: number;
    total_items: number;
}

/** Thân yêu cầu POST /cart/items — luôn yêu cầu chọn biến thể cụ thể */
export interface AddCartItemDto {
    product_id: number;
    variant_id: number;
    quantity: number;
}

export interface UpdateCartItemQuantityDto {
    quantity: number;
}
