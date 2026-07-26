import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Request } from 'express';
import { rateLimit } from '../../src/middleware/rateLimit.middleware.js';
import { AppError } from '../../src/middleware/error.middleware.js';

const makeReq = (ip: string) => ({ ip, socket: {} }) as Request;

describe('rate limit middleware', () => {
    it('allows requests under the limit', () => {
        let current = 0;
        const middleware = rateLimit({ windowMs: 1000, max: 3, now: () => current });
        const req = makeReq('1.1.1.1');
        let calls = 0;

        for (let i = 0; i < 3; i += 1) {
            middleware(req, {} as never, () => {
                calls += 1;
            });
        }

        assert.equal(calls, 3);
    });

    it('rejects once the limit is exceeded within the window', () => {
        let current = 0;
        const middleware = rateLimit({ windowMs: 1000, max: 2, now: () => current });
        const req = makeReq('2.2.2.2');

        middleware(req, {} as never, () => undefined);
        middleware(req, {} as never, () => undefined);

        assert.throws(
            () => middleware(req, {} as never, () => undefined),
            (error) =>
                error instanceof AppError &&
                error.statusCode === 429
        );
    });

    it('resets the counter once the window elapses', () => {
        let current = 0;
        const middleware = rateLimit({ windowMs: 1000, max: 1, now: () => current });
        const req = makeReq('3.3.3.3');

        middleware(req, {} as never, () => undefined);
        assert.throws(
            () => middleware(req, {} as never, () => undefined),
            AppError
        );

        current += 1001;
        let called = false;
        middleware(req, {} as never, () => {
            called = true;
        });
        assert.equal(called, true);
    });

    it('tracks separate buckets per IP', () => {
        let current = 0;
        const middleware = rateLimit({ windowMs: 1000, max: 1, now: () => current });

        let firstCalled = false;
        let secondCalled = false;
        middleware(makeReq('4.4.4.4'), {} as never, () => {
            firstCalled = true;
        });
        middleware(makeReq('5.5.5.5'), {} as never, () => {
            secondCalled = true;
        });

        assert.equal(firstCalled, true);
        assert.equal(secondCalled, true);
    });
});
