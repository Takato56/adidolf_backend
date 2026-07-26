export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'shipping'
    | 'delivered'
    | 'cancelled';

export type PaymentMethod =
    | 'COD'
    | 'VNPay'
    | 'Momo'
    | 'ZaloPay'
    | 'card'
    | 'bank_transfer';

/** Thân yêu cầu tạo đơn — không chứa bất kỳ giá trị tiền nào */
export interface CreateOrderDto {
    address_id: number;
    payment_method: PaymentMethod;
    voucher_code?: string;
    note?: string;
}

export interface ListOrdersQuery {
    status?: OrderStatus;
    limit: number;
    offset: number;
}