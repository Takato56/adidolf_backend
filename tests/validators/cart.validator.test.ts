import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
    addCartItemSchema,
    cartItemIdParamSchema,
    updateCartItemQuantitySchema
} from '../../src/validators/cart.validator.js';

describe('cart validators', () => {
    it('coerces and validates add-to-cart payloads', () => {
        assert.deepEqual(
            addCartItemSchema.parse({
                product_id: '3',
                variant_id: '7',
                quantity: '2'
            }),
            { product_id: 3, variant_id: 7, quantity: 2 }
        );
    });

    it('rejects add-to-cart payloads missing variant_id', () => {
        assert.throws(
            () => addCartItemSchema.parse({ product_id: 1, quantity: 1 }),
            ZodError
        );
    });

    it('rejects non-positive or non-integer quantity', () => {
        assert.throws(
            () =>
                addCartItemSchema.parse({
                    product_id: 1,
                    variant_id: 1,
                    quantity: 0
                }),
            ZodError
        );
        assert.throws(
            () =>
                addCartItemSchema.parse({
                    product_id: 1,
                    variant_id: 1,
                    quantity: 1.5
                }),
            ZodError
        );
    });

    it('rejects unknown fields (no client-supplied money values)', () => {
        assert.throws(
            () =>
                addCartItemSchema.parse({
                    product_id: 1,
                    variant_id: 1,
                    quantity: 1,
                    unit_price: 100
                }),
            ZodError
        );
    });

    it('validates quantity updates', () => {
        assert.deepEqual(updateCartItemQuantitySchema.parse({ quantity: '5' }), {
            quantity: 5
        });
        assert.throws(
            () => updateCartItemQuantitySchema.parse({ quantity: -1 }),
            ZodError
        );
    });

    it('coerces the cart item id param', () => {
        assert.deepEqual(cartItemIdParamSchema.parse({ itemId: '42' }), {
            itemId: 42
        });
        assert.throws(
            () => cartItemIdParamSchema.parse({ itemId: 'abc' }),
            ZodError
        );
    });
});
