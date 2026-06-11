export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

export interface RegisterDto {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
}

export interface LoginDto {
    email: string;
    password_hash: string;
}
