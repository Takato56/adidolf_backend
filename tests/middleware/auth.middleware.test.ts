import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Request } from 'express';
import { authMiddleware } from '../../src/middleware/auth.middleware.js';
import { AppError } from '../../src/middleware/error.middleware.js';
import { generateTokens } from '../../src/utils/auth.utils.js';

describe('auth middleware', () => {
    it('rejects requests without a bearer token', () => {
        const req = { headers: {} } as Request;

        assert.throws(
            () => authMiddleware(req, {} as never, () => undefined),
            (error) =>
                error instanceof AppError &&
                error.statusCode === 401 &&
                error.message === 'Unauthorized'
        );
    });

    it('rejects invalid access tokens', () => {
        const req = {
            headers: { authorization: 'Bearer not-a-token' }
        } as Request;

        assert.throws(
            () => authMiddleware(req, {} as never, () => undefined),
            (error) =>
                error instanceof AppError &&
                error.statusCode === 401 &&
                error.message === 'Unauthorized'
        );
    });

    it('attaches the verified token payload', () => {
        const payload = {
            userId: 7,
            email: 'admin@example.com',
            role: 'admin'
        };
        const { accessToken } = generateTokens(payload);
        const req = {
            headers: { authorization: `Bearer ${accessToken}` }
        } as Request;
        let called = false;

        authMiddleware(req, {} as never, () => {
            called = true;
        });

        assert.equal(called, true);
        assert.equal(req.user?.userId, payload.userId);
        assert.equal(req.user?.email, payload.email);
        assert.equal(req.user?.role, payload.role);
    });
});
