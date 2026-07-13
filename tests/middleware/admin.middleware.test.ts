import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Request } from 'express';
import { adminMiddleware } from '../../src/middleware/admin.middleware.js';
import { AppError } from '../../src/middleware/error.middleware.js';

describe('admin middleware', () => {
    it('rejects unauthenticated requests', () => {
        assert.throws(
            () => adminMiddleware({} as Request, {} as never, () => undefined),
            (error) =>
                error instanceof AppError &&
                error.statusCode === 401 &&
                error.message === 'Not authenticated'
        );
    });

    it('rejects non-admin users', () => {
        const req = {
            user: { userId: 1, email: 'user@example.com', role: 'customer' }
        } as Request;

        assert.throws(
            () => adminMiddleware(req, {} as never, () => undefined),
            (error) =>
                error instanceof AppError &&
                error.statusCode === 403 &&
                error.message === 'Access denied'
        );
    });

    it('passes admin users to the next handler', () => {
        const req = {
            user: { userId: 1, email: 'admin@example.com', role: 'admin' }
        } as Request;
        let called = false;

        adminMiddleware(req, {} as never, () => {
            called = true;
        });

        assert.equal(called, true);
    });
});
