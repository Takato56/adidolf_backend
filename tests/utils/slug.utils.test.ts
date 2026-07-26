import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSlug, slugPattern } from '../../src/utils/slug.utils.js';

describe('slug utils', () => {
    it('normalizes accents, punctuation, whitespace, and case', () => {
        assert.equal(
            generateSlug('  Dang Tu _ Sneaker!!! 2026  '),
            'dang-tu-sneaker-2026'
        );
        assert.equal(
            generateSlug('Giay Adidas Đen Trang'),
            'giay-adidas-den-trang'
        );
    });

    it('removes duplicate and edge hyphens', () => {
        assert.equal(generateSlug('---Ultra---Boost---'), 'ultra-boost');
    });

    it('matches generated slugs and rejects malformed slugs', () => {
        assert.equal(slugPattern.test(generateSlug('Air Max 90')), true);
        assert.equal(slugPattern.test('Air-Max'), false);
        assert.equal(slugPattern.test('air--max'), false);
        assert.equal(slugPattern.test('-air-max'), false);
    });
});
