import { supabase } from "../config/database.config.js";

export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    role: 'customer' | 'admin';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface UpdateUserDto {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
}

const UserModel = {
    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    async findById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
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
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

};

export default UserModel;