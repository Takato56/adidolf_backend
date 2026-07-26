import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    loginSchema,
    registerSchema
} from '../../src/validators/auth.validator.js';

describe('auth validators', () => {
    it('normalizes register input', () => {
        const parsed = registerSchema.parse({
            email: ' USER@Example.COM ',
            password: 'strong-password',
            full_name: '  Ada Lovelace  ',
            phone: ' 123456 '
        });

        assert.deepEqual(parsed, {
            email: 'user@example.com',
            password: 'strong-password',
            full_name: 'Ada Lovelace',
            phone: '123456'
        });
    });

    it('rejects invalid register input', () => {
        const result = registerSchema.safeParse({
            email: 'not-an-email',
            password: 'short',
            full_name: ' '
        });

        assert.equal(result.success, false);
        if (!result.success) {
            assert.deepEqual(
                result.error.issues.map((issue) => issue.message),
                [
                    'Invalid email format',
                    'Password must be at least 8 characters',
                    'Full name cannot be empty'
                ]
            );
        }
    });

    it('normalizes login email and keeps password unchanged', () => {
        const parsed = loginSchema.parse({
            email: ' USER@Example.COM ',
            password: ' password with spaces '
        });

        assert.deepEqual(parsed, {
            email: 'user@example.com',
            password: ' password with spaces '
        });
    });
});
