import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateLineSubtotal,
    calculateUnitPrice,
    pickPrimaryImage
} from '../../src/utils/cart.utils.js';

describe('cart utils', () => {
    it('calculates unit price from base price plus variant extra price', () => {
        assert.equal(calculateUnitPrice(1200000, 50000), 1250000);
        assert.equal(calculateUnitPrice(1200000, 0), 1200000);
    });

    it('calculates line subtotal from unit price and quantity', () => {
        assert.equal(calculateLineSubtotal(1250000, 2), 2500000);
        assert.equal(calculateLineSubtotal(1250000, 0), 0);
    });

    it('picks the primary image when present', () => {
        assert.equal(
            pickPrimaryImage([
                { image_url: 'a.png', is_primary: false, sort_order: 0 },
                { image_url: 'b.png', is_primary: true, sort_order: 1 }
            ]),
            'b.png'
        );
    });

    it('falls back to the lowest sort_order when no image is primary', () => {
        assert.equal(
            pickPrimaryImage([
                { image_url: 'a.png', is_primary: false, sort_order: 2 },
                { image_url: 'b.png', is_primary: false, sort_order: 1 }
            ]),
            'b.png'
        );
    });

    it('returns null when there are no images', () => {
        assert.equal(pickPrimaryImage([]), null);
        assert.equal(pickPrimaryImage(), null);
    });
});
