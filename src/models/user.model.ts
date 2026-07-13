import { supabase } from '../config/supabase.config';
import {
    type User,
    type UpdateUserDto,
    PublicUser
} from '../types/user.types.js';
import { RegisterDto } from '../types/auth.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';

const UserModel = {
    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw toDatabaseError(error);
        return data;
    },

    async findById(id: number): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async create(dto: RegisterDto): Promise<PublicUser> {
        const { data, error } = await supabase
            .from('users')
            .insert(dto)
            .select(
                'user_id, email, full_name, phone, avatar_url, role, is_active, created_at'
            )
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('user_id', id)
            .select()
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

        if (error) throw toDatabaseError(error);
    }
};

export default UserModel;
