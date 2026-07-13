import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    categoryIdSchema,
    createCategorySchema,
    updateCategorySchema
} from '../../src/validators/category.validator.js';

describe('category validators', () => {
    it('trims and accepts valid category creation data', () => {
        const parsed = createCategorySchema.parse({
            name: '  Running Shoes  ',
            slug: 'running-shoes',
            description: '  Road-ready shoes  ',
            image_url: 'https://example.com/category.png'
        });

        assert.deepEqual(parsed, {
            name: 'Running Shoes',
            slug: 'running-shoes',
            description: 'Road-ready shoes',
            image_url: 'https://example.com/category.png'
        });
    });

    it('rejects malformed slugs and image URLs', () => {
        const result = createCategorySchema.safeParse({
            name: 'Shoes',
            slug: 'Running Shoes',
            image_url: 'not-a-url'
        });

        assert.equal(result.success, false);
        if (!result.success) {
            assert.deepEqual(
                result.error.issues.map((issue) => issue.message),
                [
                    'Slug must be lowercase alphanumeric with hyphens only',
                    'Invalid image URL'
                ]
            );
        }
    });

    it('requires at least one field for category updates', () => {
        const result = updateCategorySchema.safeParse({});

        assert.equal(result.success, false);
        if (!result.success) {
            assert.equal(
                result.error.issues[0]?.message,
                'At least one field must be provided'
            );
        }
    });

    it('coerces positive integer IDs', () => {
        assert.equal(categoryIdSchema.parse('42'), 42);
        assert.equal(categoryIdSchema.safeParse('0').success, false);
        assert.equal(categoryIdSchema.safeParse('1.2').success, false);
    });
});
