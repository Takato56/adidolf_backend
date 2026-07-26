import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type {
    Address,
    CreateAddressDto,
    UpdateAddressDto
} from '../types/address.types.js';

const AddressModel = {
    async findAllByUser(userId: number): Promise<Address[]> {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw toDatabaseError(error);
        return (data ?? []) as Address[];
    },

    async findById(id: number): Promise<Address | null> {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('address_id', id)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as Address | null;
    },

    /** Bỏ cờ is_default của mọi địa chỉ khác thuộc cùng tài khoản. */
    async clearDefault(userId: number, exceptId?: number): Promise<void> {
        let query = supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true);

        if (exceptId !== undefined) {
            query = query.neq('address_id', exceptId);
        }

        const { error } = await query;
        if (error) throw toDatabaseError(error);
    },

    async create(userId: number, dto: CreateAddressDto): Promise<Address> {
        if (dto.is_default) {
            await this.clearDefault(userId);
        }

        const { data, error } = await supabase
            .from('addresses')
            .insert({ ...dto, user_id: userId })
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Address;
    },

    async update(
        id: number,
        userId: number,
        dto: UpdateAddressDto
    ): Promise<Address> {
        if (dto.is_default) {
            await this.clearDefault(userId, id);
        }

        const { data, error } = await supabase
            .from('addresses')
            .update(dto)
            .eq('address_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Address;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('address_id', id);

        if (error) throw toDatabaseError(error);
    },

    async setDefault(id: number, userId: number): Promise<Address> {
        await this.clearDefault(userId, id);

        const { data, error } = await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('address_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Address;
    },

    /** Chặn xóa nếu địa chỉ đang được một đơn hàng tham chiếu. */
    async isReferencedByOrder(id: number): Promise<boolean> {
        const { count, error } = await supabase
            .from('orders')
            .select('order_id', { count: 'exact', head: true })
            .eq('address_id', id);

        if (error) throw toDatabaseError(error);
        return (count ?? 0) > 0;
    }
};

export default AddressModel;
