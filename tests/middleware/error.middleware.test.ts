import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { type Request, type NextFunction, type Response } from 'express';
import {
    AppError,
    errorMiddleware
} from '../../src/middleware/error.middleware.js';
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
});
