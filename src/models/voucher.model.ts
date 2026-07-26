import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { Voucher } from '../types/voucher.types.js';

const VoucherModel = {
    /** So khớp chính xác, phân biệt hoa/thường (đã trim ở tầng validator). */
    async findByCode(code: string): Promise<Voucher | null> {
        const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as Voucher | null;
    },

    /** Số lần chính người dùng này đã dùng voucher — để chặn dùng lại. */
    async countRedemptionsByUser(
        voucherId: number,
        userId: number
    ): Promise<number> {
        const { count, error } = await supabase
            .from('voucher_redemptions')
            .select('redemption_id', { count: 'exact', head: true })
            .eq('voucher_id', voucherId)
            .eq('user_id', userId);

        if (error) throw toDatabaseError(error);
        return count ?? 0;
    }
};

export default VoucherModel;
