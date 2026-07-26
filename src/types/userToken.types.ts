export interface UserToken {
    token_id: number;
    created_at: string;
    user_id: number;
    refresh_token: string;
    expired_in: string | null;
}

export interface CreateUserTokenDto {
    user_id: number;
    refresh_token: string;
    expired_in?: string | null;
}

export interface LegacyRefreshTokenCreateDto {
    userId: number;
    token: string;
    expiresAt: Date;
}
