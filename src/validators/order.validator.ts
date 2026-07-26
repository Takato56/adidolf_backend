import { z } from 'zod';

/**
 * Thân yêu cầu POST /orders.
 * Chủ ý KHÔNG có bất kỳ trường tiền nào (subtotal, total_price, shipping_fee…).
 * .strict() khiến mọi trường lạ do client gửi kèm đều bị từ chối, ngăn việc
 * cố tình chèn giá trị tiền vào yêu cầu.
 */
export const createOrderSchema = z
    .object({
        address_id: z.coerce.number().int().positive({
            message: 'address_id phải là số nguyên dương'
        }),
        payment_method: z.enum(
            ['COD', 'VNPay', 'Momo', 'ZaloPay', 'card', 'bank_transfer'],
            { message: 'Phương thức thanh toán không hợp lệ' }
        ),
        voucher_code: z.string().trim().min(1).max(50).optional(),
        note: z.string().trim().max(500).optional()
    })
    .strict();

/** Tham số truy vấn GET /orders */
export const listOrdersSchema = z.object({
    status: z
        .enum(['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'])
        .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0)
});

/** Tham số đường dẫn :id */
export const orderIdParamSchema = z.object({
    id: z.coerce.number().int().positive({ message: 'Mã đơn hàng không hợp lệ' })
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;