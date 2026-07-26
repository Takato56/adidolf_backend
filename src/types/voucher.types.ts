export type VoucherDiscountType = 'percent' | 'fixed';

export interface Voucher {
    voucher_id: number;
    code: string;
    discount_type: VoucherDiscountType;
    discount_value: number;
    max_discount: number | null;
    min_order_amount: number;
    usage_limit: number | null;
    used_count: number;
    valid_from: string;
    valid_to: string;
    is_active: boolean;
    target_user_id: number | null;
}

export interface VoucherEvaluation {
    valid: boolean;
    discount_amount: number;
    reason: string | null;
}
