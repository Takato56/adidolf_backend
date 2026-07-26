import type { Voucher, VoucherEvaluation } from '../types/voucher.types.js';

/**
 * Kiểm tra một voucher có áp dụng được cho một đơn hàng dự kiến hay không.
 * Hàm thuần túy — không truy cập DB — để test được đầy đủ các nhánh.
 *
 * `usedCountByUser` là số lần chính người dùng này đã sử dụng voucher
 * (đếm từ voucher_redemptions); mỗi tài khoản chỉ được dùng một voucher
 * đúng một lần, tách biệt với `usage_limit`/`used_count` vốn là giới hạn
 * tổng trên toàn hệ thống.
 */
export const evaluateVoucher = (
    voucher: Voucher,
    subtotal: number,
    userId: number,
    usedCountByUser: number,
    now: Date = new Date()
): VoucherEvaluation => {
    const invalid = (reason: string): VoucherEvaluation => ({
        valid: false,
        discount_amount: 0,
        reason
    });

    if (!voucher.is_active) {
        return invalid('Voucher is not active');
    }

    const validFrom = new Date(voucher.valid_from);
    const validTo = new Date(voucher.valid_to);
    if (now < validFrom || now > validTo) {
        return invalid('Voucher is not within its valid date range');
    }

    if (subtotal < voucher.min_order_amount) {
        return invalid(
            `Order subtotal must be at least ${voucher.min_order_amount}`
        );
    }

    if (
        voucher.usage_limit !== null &&
        voucher.used_count >= voucher.usage_limit
    ) {
        return invalid('Voucher usage limit has been reached');
    }

    if (voucher.target_user_id !== null && voucher.target_user_id !== userId) {
        return invalid('Voucher is not available for this account');
    }

    if (usedCountByUser > 0) {
        return invalid('You have already used this voucher');
    }

    let discount =
        voucher.discount_type === 'percent'
            ? (subtotal * voucher.discount_value) / 100
            : voucher.discount_value;

    if (voucher.discount_type === 'percent' && voucher.max_discount !== null) {
        discount = Math.min(discount, voucher.max_discount);
    }

    discount = Math.min(Math.max(discount, 0), subtotal);

    return { valid: true, discount_amount: discount, reason: null };
};
