import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorMiddleware = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Default to 500 if no statusCode
    const statusCode = (err as AppError).statusCode ?? 500;
    const isOperational = (err as AppError).isOperational ?? false;

    // Operational errors: things we threw ourselves (404, 400, 401...)
    if (isOperational) {
        res.status(statusCode).json({
            status: 'error',
            message: err.message
        });
        return;
    }

    // Unexpected errors: bugs, crashes, unhandled cases
    if (env.isDev) {
        res.status(500).json({
            status: 'error',
            message: err.message,
            stack: err.stack
        });
        return;
    }

    // Production: never leak internal details
    console.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong. Please try again later.'
    });
};
