import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../../src/middleware/error.middleware.js';
import {
    isSupabaseNotFound,
    SUPABASE_NOT_FOUND_CODE,
    toDatabaseError
} from '../../src/utils/supabase-error.utils.js';

describe('supabase error utils', () => {
    it('detects Supabase not found errors', () => {
        assert.equal(
            isSupabaseNotFound({ code: SUPABASE_NOT_FOUND_CODE }),
            true
        );
        assert.equal(isSupabaseNotFound({ code: '23505' }), false);
        assert.equal(isSupabaseNotFound(null), false);
    });

    it('maps known database errors to operational AppErrors', () => {
        const duplicate = toDatabaseError({
            code: '23505',
            message: 'duplicate key'
        });
        const foreignKey = toDatabaseError({
            code: '23503',
            message: 'foreign key'
        });
        const check = toDatabaseError({ code: '23514', message: 'check' });
        const notNull = toDatabaseError({
            code: '23502',
            message: 'not null'
        });

        assert.ok(duplicate instanceof AppError);
        assert.equal(duplicate.statusCode, 409);
        assert.equal(foreignKey.statusCode, 400);
        assert.equal(check.statusCode, 400);
        assert.equal(notNull.statusCode, 400);
    });

    it('falls back to the original message for unknown errors', () => {
        const error = toDatabaseError({ message: 'database unavailable' });

        assert.equal(error.statusCode, 500);
        assert.equal(error.message, 'database unavailable');
    });
});
