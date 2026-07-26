import { AppError } from '../middleware/error.middleware.js';

type SupabaseErrorLike = {
    message: string;
    code?: string | null;
};

export const SUPABASE_NOT_FOUND_CODE = 'PGRST116';

export const isSupabaseNotFound = (
    error: { code?: string | null } | null
): boolean => error?.code === SUPABASE_NOT_FOUND_CODE;

export const toDatabaseError = (error: SupabaseErrorLike): AppError => {
    switch (error.code) {
        case '23505':
            return new AppError(
                'Duplicate record violates a unique constraint',
                409
            );
        case '23503':
            return new AppError(
                'Related record not found or still referenced',
                400
            );
        case '23514':
            return new AppError(
                'Record violates a database check constraint',
                400
            );
        default:
            return new AppError(error.message, 500);
    }
};
