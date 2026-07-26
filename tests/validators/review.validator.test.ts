import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
    approveReviewSchema,
    createReviewSchema,
    reviewIdSchema,
    updateReviewSchema
} from '../../src/validators/review.validator.js';

describe('review validators', () => {
    it('coerces and accepts a valid review creation payload', () => {
        assert.deepEqual(
            createReviewSchema.parse({
                rating: '5',
                comment: '  Great shoes!  ',
                order_item_id: '12'
            }),
            { rating: 5, comment: 'Great shoes!', order_item_id: 12 }
        );
    });

    it('allows creating a review without order_item_id or comment', () => {
        assert.deepEqual(createReviewSchema.parse({ rating: 4 }), {
            rating: 4
        });
    });

    it('rejects a rating outside 1..5', () => {
        assert.throws(() => createReviewSchema.parse({ rating: 0 }), ZodError);
        assert.throws(() => createReviewSchema.parse({ rating: 6 }), ZodError);
    });

    it('rejects a non-integer rating', () => {
        assert.throws(() => createReviewSchema.parse({ rating: 3.5 }), ZodError);
    });

    it('rejects unknown fields on review creation', () => {
        assert.throws(
            () =>
                createReviewSchema.parse({
                    rating: 5,
                    is_approved: true
                }),
            ZodError
        );
    });

    it('requires at least one field for review updates', () => {
        assert.throws(() => updateReviewSchema.parse({}), ZodError);
    });

    it('accepts a partial review update', () => {
        assert.deepEqual(updateReviewSchema.parse({ rating: '3' }), {
            rating: 3
        });
    });

    it('validates the approve payload', () => {
        assert.deepEqual(approveReviewSchema.parse({ is_approved: true }), {
            is_approved: true
        });
        assert.throws(
            () => approveReviewSchema.parse({ is_approved: 'true' }),
            ZodError
        );
    });

    it('coerces positive integer review IDs', () => {
        assert.equal(reviewIdSchema.parse('7'), 7);
        assert.throws(() => reviewIdSchema.parse('abc'), ZodError);
        assert.throws(() => reviewIdSchema.parse('-1'), ZodError);
    });
});
