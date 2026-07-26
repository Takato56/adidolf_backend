import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import { validateVoucherSchema } from '../../src/validators/voucher.validator.js';

describe('voucher validators', () => {
    it('trims the voucher code', () => {
        assert.deepEqual(validateVoucherSchema.parse({ code: '  SALE10  ' }), {
            code: 'SALE10'
        });
    });

    it('rejects an empty code', () => {
        assert.throws(() => validateVoucherSchema.parse({ code: '' }), ZodError);
        assert.throws(() => validateVoucherSchema.parse({ code: '   ' }), ZodError);
    });

    it('rejects a missing code', () => {
        assert.throws(() => validateVoucherSchema.parse({}), ZodError);
    });

    it('rejects unknown fields (no client-supplied discount values)', () => {
        assert.throws(
            () =>
                validateVoucherSchema.parse({
                    code: 'SALE10',
                    discount_amount: 100
                }),
            ZodError
        );
    });
});
