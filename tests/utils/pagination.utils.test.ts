import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPaginatedResponse,
    buildPaginationMeta,
    parsePagination
} from '../../src/utils/pagination.utils.js';

describe('pagination utils', () => {
    it('defaults to limit 20 and offset 0 when nothing is provided', () => {
        assert.deepEqual(parsePagination({}), { limit: 20, offset: 0 });
    });

    it('coerces string limit/offset from query params', () => {
        assert.deepEqual(parsePagination({ limit: '10', offset: '30' }), {
            limit: 10,
            offset: 30
        });
    });

    it('caps limit at 100', () => {
        assert.deepEqual(parsePagination({ limit: '500' }), {
            limit: 100,
            offset: 0
        });
    });

    it('falls back to the default limit for invalid values', () => {
        assert.deepEqual(parsePagination({ limit: '0' }), {
            limit: 20,
            offset: 0
        });
        assert.deepEqual(parsePagination({ limit: 'abc' }), {
            limit: 20,
            offset: 0
        });
        assert.deepEqual(parsePagination({ offset: '-5' }), {
            limit: 20,
            offset: 0
        });
    });

    it('derives offset from a 1-based page when offset is absent', () => {
        assert.deepEqual(parsePagination({ page: '3', limit: '10' }), {
            limit: 10,
            offset: 20
        });
    });

    it('prefers explicit offset over page', () => {
        assert.deepEqual(
            parsePagination({ page: '3', offset: '5', limit: '10' }),
            { limit: 10, offset: 5 }
        );
    });

    it('builds pagination meta and a paginated response envelope', () => {
        const params = { limit: 10, offset: 20 };
        assert.deepEqual(buildPaginationMeta(42, params), {
            total: 42,
            limit: 10,
            offset: 20
        });
        assert.deepEqual(buildPaginatedResponse([1, 2, 3], 42, params), {
            status: 'success',
            data: [1, 2, 3],
            meta: { total: 42, limit: 10, offset: 20 }
        });
    });
});
