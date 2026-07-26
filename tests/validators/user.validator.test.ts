import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
    changePasswordSchema,
    updateProfileSchema
} from '../../src/validators/user.validator.js';

describe('user validators', () => {
    it('accepts a partial profile update', () => {
        assert.deepEqual(
            updateProfileSchema.parse({ full_name: '  Nguyen Van A  ' }),
            { full_name: 'Nguyen Van A' }
        );
    });

    it('rejects an empty profile update', () => {
        assert.throws(() => updateProfileSchema.parse({}), ZodError);
    });

    it('rejects an invalid avatar URL', () => {
        assert.throws(
            () => updateProfileSchema.parse({ avatar_url: 'not-a-url' }),
            ZodError
        );
    });

    it('rejects unknown fields on profile update', () => {
        assert.throws(
            () => updateProfileSchema.parse({ role: 'admin' }),
            ZodError
        );
    });

    it('validates a password change payload', () => {
        assert.deepEqual(
            changePasswordSchema.parse({
                old_password: 'oldPass123',
                new_password: 'newPass456'
            }),
            { old_password: 'oldPass123', new_password: 'newPass456' }
        );
    });

    it('rejects a new password shorter than 8 characters', () => {
        assert.throws(
            () =>
                changePasswordSchema.parse({
                    old_password: 'oldPass123',
                    new_password: 'short'
                }),
            ZodError
        );
    });

    it('rejects when the new password matches the old password', () => {
        assert.throws(
            () =>
                changePasswordSchema.parse({
                    old_password: 'samePass123',
                    new_password: 'samePass123'
                }),
            ZodError
        );
    });
});
