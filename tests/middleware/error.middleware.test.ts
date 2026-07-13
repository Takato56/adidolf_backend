import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { type Request, type NextFunction, type Response } from 'express';
import {
    AppError,
    errorMiddleware
} from '../../src/middleware/error.middleware.js';
import { env } from '../../src/config/env.config.js';
import { createMockResponse } from '../helpers/http.js';

describe('error middleware', () => {
    it('formats operational errors with their status code', () => {
        const res = createMockResponse();

        errorMiddleware(
            new AppError('Category not found', 404),
            {} as Request,
            res as unknown as Response,
            (() => undefined) as NextFunction
        );

        assert.equal(res.statusCode, 404);
        assert.deepEqual(res.body, {
            status: 'error',
            message: 'Category not found'
        });
    });

    it('formats Zod validation errors as bad requests', () => {
        const parsed = z
            .object({
                name: z.string().min(2, 'Name is too short'),
                price: z.number('Price is required')
            })
            .safeParse({ name: 'A' });
        assert.equal(parsed.success, false);

        const res = createMockResponse();
        if (!parsed.success) {
            errorMiddleware(
                parsed.error,
                {} as Request,
                res as unknown as Response,
                (() => undefined) as NextFunction
            );
        }

        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.body, {
            status: 'error',
            message: 'Name is too short, Price is required'
        });
    });

    it('returns stack details for unexpected development errors', () => {
        const originalNodeEnv = env.NODE_ENV;
        (env as any).NODE_ENV = 'development';
        const res = createMockResponse();

        try {
            errorMiddleware(
                new Error('Unexpected development failure'),
                {} as Request,
                res as unknown as Response,
                (() => undefined) as NextFunction
            );
        } finally {
            (env as any).NODE_ENV = originalNodeEnv;
        }

        assert.equal(res.statusCode, 500);
        assert.equal(
            (res.body as any).message,
            'Unexpected development failure'
        );
        assert.ok((res.body as any).stack);
    });

    it('hides unexpected production error details', () => {
        const originalNodeEnv = env.NODE_ENV;
        const originalConsoleError = console.error;
        let logged = false;
        (env as any).NODE_ENV = 'production';
        console.error = () => {
            logged = true;
        };
        const res = createMockResponse();

        try {
            errorMiddleware(
                new Error('Unexpected production failure'),
                {} as Request,
                res as unknown as Response,
                (() => undefined) as NextFunction
            );
        } finally {
            (env as any).NODE_ENV = originalNodeEnv;
            console.error = originalConsoleError;
        }

        assert.equal(logged, true);
        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.body, {
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    });
});
