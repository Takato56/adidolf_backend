import { supabase } from '../config/supabase.config';
import {
    type CreateUserTokenDto,
    type LegacyRefreshTokenCreateDto,
    type UserToken
} from '../types/userToken.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';

const TABLE = 'users_tokens';

const toCreateDto = (
    dto: CreateUserTokenDto | LegacyRefreshTokenCreateDto
): CreateUserTokenDto => {
    if ('refresh_token' in dto) {
        return dto;
    }

    return {
        user_id: dto.userId,
        refresh_token: dto.token,
        expired_in: dto.expiresAt.toISOString()
    };
};

const UserTokenModel = {
    async findById(id: number): Promise<UserToken | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('token_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as UserToken;
    },

    async findOne(filter: { token: string }): Promise<UserToken | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('refresh_token', filter.token)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as UserToken;
    },

    async create(
        dto: CreateUserTokenDto | LegacyRefreshTokenCreateDto
    ): Promise<UserToken> {
        const { data, error } = await supabase
            .from(TABLE)
            .insert(toCreateDto(dto))
            .select()
            .single();

        if (error) throw toDatabaseError(error);
        return data as UserToken;
    },

    async deleteOne(filter: { token: string }): Promise<void> {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq('refresh_token', filter.token);

        if (error) throw toDatabaseError(error);
    },

    /** Hủy toàn bộ refresh token của một tài khoản (đổi mật khẩu, logout-all). */
    async deleteAllForUser(userId: number): Promise<void> {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) throw toDatabaseError(error);
    },

    async deleteExpired(): Promise<void> {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .not('expired_in', 'is', null)
            .lte('expired_in', new Date().toISOString());

        if (error) throw toDatabaseError(error);
    }
};

export default UserTokenModel;
