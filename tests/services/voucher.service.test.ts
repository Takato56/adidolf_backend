import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVoucher } from '../../src/services/voucher.service.js';
import type { Voucher } from '../../src/types/voucher.types.js';

const NOW = new Date('2026-06-15T00:00:00Z');

const baseVoucher: Voucher = {
    voucher_id: 1,
    code: 'SALE10',
    discount_type: 'percent',
    discount_value: 10,
    max_discount: null,
    min_order_amount: 0,
    usage_limit: null,
    used_count: 0,
    valid_from: '2026-06-01T00:00:00Z',
    valid_to: '2026-06-30T00:00:00Z',
    is_active: true,
    target_user_id: null
};

describe('evaluateVoucher', () => {
    it('rejects an inactive voucher', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, is_active: false },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.equal(result.discount_amount, 0);
        assert.match(result.reason ?? '', /not active/i);
    });

    it('rejects a voucher before its valid_from date', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, valid_from: '2026-07-01T00:00:00Z' },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /valid date range/i);
    });

    it('rejects a voucher after its valid_to date', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, valid_to: '2026-05-01T00:00:00Z' },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /valid date range/i);
    });

    it('accepts boundary dates (now === valid_from or now === valid_to)', () => {
        const atStart = evaluateVoucher(
            { ...baseVoucher, valid_from: NOW.toISOString() },
            100,
            1,
            0,
            NOW
        );
        const atEnd = evaluateVoucher(
            { ...baseVoucher, valid_to: NOW.toISOString() },
            100,
            1,
            0,
            NOW
        );
        assert.equal(atStart.valid, true);
        assert.equal(atEnd.valid, true);
    });

    it('rejects when subtotal is below min_order_amount', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, min_order_amount: 200 },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /at least 200/);
    });

    it('rejects once usage_limit has been reached', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, usage_limit: 5, used_count: 5 },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /usage limit/i);
    });

    it('allows unlimited usage when usage_limit is null', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, usage_limit: null, used_count: 999999 },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
    });

    it('rejects when target_user_id does not match the current user', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, target_user_id: 42 },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /not available for this account/i);
    });

    it('allows the matching target user', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, target_user_id: 1 },
            100,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
    });

    it('rejects when the user has already redeemed this voucher', () => {
        const result = evaluateVoucher(baseVoucher, 100, 1, 1, NOW);
        assert.equal(result.valid, false);
        assert.match(result.reason ?? '', /already used/i);
    });

    it('computes a percent discount with no max_discount cap', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, discount_type: 'percent', discount_value: 10 },
            200,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
        assert.equal(result.discount_amount, 20);
    });

    it('caps a percent discount at max_discount', () => {
        const result = evaluateVoucher(
            {
                ...baseVoucher,
                discount_type: 'percent',
                discount_value: 50,
                max_discount: 30
            },
            200,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
        assert.equal(result.discount_amount, 30);
    });

    it('computes a fixed discount ignoring max_discount', () => {
        const result = evaluateVoucher(
            {
                ...baseVoucher,
                discount_type: 'fixed',
                discount_value: 50,
                max_discount: 10
            },
            200,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
        assert.equal(result.discount_amount, 50);
    });

    it('never discounts more than the subtotal itself', () => {
        const result = evaluateVoucher(
            { ...baseVoucher, discount_type: 'fixed', discount_value: 500 },
            50,
            1,
            0,
            NOW
        );
        assert.equal(result.valid, true);
        assert.equal(result.discount_amount, 50);
    });
});
