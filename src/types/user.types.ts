export interface User {
    user_id: number;
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
