import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
    addressIdParamSchema,
    createAddressSchema,
    updateAddressSchema
} from '../../src/validators/address.validator.js';

describe('address validators', () => {
    it('trims and accepts valid address creation data', () => {
        assert.deepEqual(
            createAddressSchema.parse({
                recipient_name: '  Nguyen Van A  ',
                phone: ' 0901234567 ',
                address_details: ' 123 Le Loi, Q1, HCMC ',
                is_default: true
            }),
            {
                recipient_name: 'Nguyen Van A',
                phone: '0901234567',
                address_details: '123 Le Loi, Q1, HCMC',
                is_default: true
            }
        );
    });

    it('requires recipient_name, phone, and address_details', () => {
        assert.throws(
            () =>
                createAddressSchema.parse({
                    phone: '0901234567',
                    address_details: '123 Le Loi'
                }),
            ZodError
        );
    });

    it('rejects unknown fields on address creation', () => {
        assert.throws(
            () =>
                createAddressSchema.parse({
                    recipient_name: 'Nguyen Van A',
                    phone: '0901234567',
                    address_details: '123 Le Loi',
                    user_id: 999
                }),
            ZodError
        );
    });

    it('requires at least one field for address updates', () => {
        assert.throws(() => updateAddressSchema.parse({}), ZodError);
    });

    it('accepts a partial address update', () => {
        assert.deepEqual(updateAddressSchema.parse({ is_default: true }), {
            is_default: true
        });
    });

    it('coerces positive integer address IDs', () => {
        assert.equal(addressIdParamSchema.parse('42'), 42);
        assert.throws(() => addressIdParamSchema.parse('abc'), ZodError);
        assert.throws(() => addressIdParamSchema.parse('-1'), ZodError);
    });
});
