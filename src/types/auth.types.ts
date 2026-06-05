export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}
