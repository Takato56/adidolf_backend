import { z } from 'zod';

/**
 * Thân yêu cầu POST /cart/items. Yêu cầu chọn biến thể cụ thể (variant_id)
 * để có thể xác định đơn giá và tồn kho chính xác.
 */
export const addCartItemSchema = z
    .object({
        product_id: z.coerce.number().int().positive({
            message: 'product_id phải là số nguyên dương'
        }),
        variant_id: z.coerce.number().int().positive({
            message: 'variant_id phải là số nguyên dương'
        }),
        quantity: z.coerce.number().int().positive({
            message: 'quantity phải lớn hơn 0'
        })
    })
    .strict();

export const updateCartItemQuantitySchema = z
    .object({
        quantity: z.coerce.number().int().positive({
            message: 'quantity phải lớn hơn 0'
        })
    })
    .strict();

export const cartItemIdParamSchema = z.object({
    itemId: z.coerce.number().int().positive({
        message: 'Mã dòng giỏ hàng không hợp lệ'
    })
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemQuantityInput = z.infer<
    typeof updateCartItemQuantitySchema
>;
