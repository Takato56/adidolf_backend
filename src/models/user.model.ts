import { supabase } from '../config/database/supabase.config';
import { type User, type UpdateUserDto } from '../types/user.types.js';

const UserModel = {
    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    async findById(id: number): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', id)
            .single();

        if (error) return null;
        return data;
    },

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return data;
    },

    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('user_id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

        if (error) throw new Error(error.message);
    }
};

export default UserModel;
