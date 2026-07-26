import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createProductImagesSchema,
    createProductSchema,
    productFiltersSchema,
    productIdSchema,
    productImageSchema,
    updateProductImageSchema,
    updateProductSchema
} from '../../src/validators/product.validator.js';

describe('product validators', () => {
    it('coerces product creation form values', () => {
        const parsed = createProductSchema.parse({
            category_id: '3',
            name: '  Samba OG  ',
            base_price: '120.5',
            brand: '',
            description: '',
            is_published: 'true',
            images: [
                {
                    image_url: 'https://example.com/samba.png',
                    is_primary: 'false',
                    sort_order: '2',
                    alt_text: ''
                }
            ]
        });

        assert.deepEqual(parsed, {
            category_id: 3,
            name: 'Samba OG',
            base_price: 120.5,
            brand: undefined,
            description: undefined,
            is_published: true,
            images: [
                {
                    image_url: 'https://example.com/samba.png',
                    is_primary: false,
                    sort_order: 2,
                    alt_text: undefined
                }
            ]
        });
    });

    it('validates product images and booleanish values', () => {
        assert.deepEqual(
            productImageSchema.parse({
                image_url: 'https://example.com/image.jpg',
                is_primary: 'TRUE'
            }),
            {
                image_url: 'https://example.com/image.jpg',
                is_primary: true
            }
        );

        assert.equal(
            productImageSchema.safeParse({
                image_url: 'https://example.com/image.jpg',
                is_primary: 'yes'
            }).success,
            false
        );
    });

    it('accepts either a single image object or an images array', () => {
        assert.deepEqual(
            createProductImagesSchema.parse({
                image_url: 'https://example.com/one.jpg'
            }),
            [{ image_url: 'https://example.com/one.jpg' }]
        );

        assert.deepEqual(
            createProductImagesSchema.parse({
                images: [{ image_url: 'https://example.com/two.jpg' }]
            }),
            [{ image_url: 'https://example.com/two.jpg' }]
        );
    });

    it('requires at least one field for product updates', () => {
        const productResult = updateProductSchema.safeParse({});
        const imageResult = updateProductImageSchema.safeParse({});

        assert.equal(productResult.success, false);
        assert.equal(imageResult.success, false);
    });

    it('coerces product IDs and filters', () => {
        assert.equal(productIdSchema.parse('9'), 9);
        assert.equal(productIdSchema.safeParse('-1').success, false);

        assert.deepEqual(
            productFiltersSchema.parse({
                category_id: '4',
                min_price: '10',
                max_price: '200',
                brand: ' Adidas ',
                search: ' samba '
            }),
            {
                category_id: 4,
                min_price: 10,
                max_price: 200,
                brand: 'Adidas',
                search: 'samba'
            }
        );
    });
});
