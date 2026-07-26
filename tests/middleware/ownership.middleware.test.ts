import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Request, type Response } from 'express';
import { requireOwnership } from '../../src/middleware/ownership.middleware.js';
import { AppError } from '../../src/middleware/error.middleware.js';

describe('ownership middleware', () => {
    it('rejects unauthenticated requests', async () => {
        const middleware = requireOwnership('addresses', 'id');
        const req = { params: { id: '1' } } as unknown as Request;

        await assert.rejects(
            () => middleware(req, {} as Response, () => undefined),
            (error) => error instanceof AppError && error.statusCode === 401
        );
    });

    it('rejects when the id param is missing', async () => {
        const middleware = requireOwnership('addresses', 'id');
        const req = {
            user: { userId: 1, email: 'user@example.com', role: 'customer' },
            params: {}
        } as unknown as Request;

        await assert.rejects(
            () => middleware(req, {} as Response, () => undefined),
            (error) => error instanceof AppError && error.statusCode === 400
        );
    });

    it('bypasses the ownership check for admins without querying the database', async () => {
        const middleware = requireOwnership('addresses', 'id');
        const req = {
            user: { userId: 1, email: 'admin@example.com', role: 'admin' },
            params: { id: '999' }
        } as unknown as Request;
        let called = false;

        await middleware(req, {} as Response, () => {
            called = true;
        });

        assert.equal(called, true);
    });
});
