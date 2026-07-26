import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    deleteProductImageFromStorageUrl,
    getProductImageStoragePathFromUrl
} from '../../src/services/storage.service.js';

describe('storage service', () => {
    const bucket =
        process.env.SUPABASE_PRODUCT_IMAGE_BUCKET ?? 'product-images';

    it('extracts public product image storage paths', () => {
        const path = getProductImageStoragePathFromUrl(
            `https://project.supabase.co/storage/v1/object/public/${bucket}/products/12/main%20shoe.png`
        );

        assert.equal(path, 'products/12/main shoe.png');
    });

    it('extracts signed product image storage paths', () => {
        const path = getProductImageStoragePathFromUrl(
            `https://project.supabase.co/storage/v1/object/sign/${bucket}/products/12/side.jpg?token=abc`
        );

        assert.equal(path, 'products/12/side.jpg');
    });

    it('returns null for unrelated or invalid URLs', () => {
        assert.equal(
            getProductImageStoragePathFromUrl('https://example.com/image.jpg'),
            null
        );
        assert.equal(getProductImageStoragePathFromUrl('not-a-url'), null);
    });

    it('does nothing when asked to delete an unrelated image URL', async () => {
        await deleteProductImageFromStorageUrl('https://example.com/image.jpg');
        await deleteProductImageFromStorageUrl('not-a-url');
    });
});
