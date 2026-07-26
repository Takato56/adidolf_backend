import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { Voucher } from '../types/voucher.types.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const ADMIN_DEFAULT_ORDER = 'valid_from';
const ADMIN_SORTABLE_FIELDS = new Set([
    'voucher_id',
    'code',
    'valid_from',
    'valid_to',
    'discount_type',
    'is_active',
    'target_user_id'
]);

const VoucherModel = {
    /** GET /admin/vouchers — CRUD chung cho trang quản trị. */
    async adminFindAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('vouchers').select('*');

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && ADMIN_SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : ADMIN_DEFAULT_ORDER;

        query = query.order(sortColumn, {
            ascending: options.ascending ?? false
        });

        if (options.limit !== undefined) {
            const offset = options.offset ?? 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return (data ?? []) as AdminRecord[];
    },

    async adminFindById(id: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('voucher_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminCreate(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('vouchers')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminUpdate(id: number, payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('vouchers')
            .update(payload)
            .eq('voucher_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminDelete(id: number): Promise<void> {
        const { error } = await supabase
            .from('vouchers')
            .delete()
            .eq('voucher_id', id);

        if (error) throw toDatabaseError(error);
    },

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
