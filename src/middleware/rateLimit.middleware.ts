import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from './error.middleware.js';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    /** Cho phép tiêm thời gian trong test thay vì phụ thuộc Date.now thực. */
    now?: () => number;
}

interface Bucket {
    count: number;
    resetAt: number;
}

const getClientIp = (req: Request): string =>
    req.ip ?? req.socket?.remoteAddress ?? 'unknown';

/**
 * Giới hạn tần suất theo IP, lưu trong bộ nhớ tiến trình (không dùng thư
 * viện ngoài, không bền qua restart) — đủ dùng cho một service quy mô nhỏ.
 */
export const rateLimit = ({
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    now = Date.now
}: RateLimitOptions) => {
    const buckets = new Map<string, Bucket>();

    return (req: Request, _res: Response, next: NextFunction): void => {
        const key = getClientIp(req);
        const current = now();
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= current) {
            buckets.set(key, { count: 1, resetAt: current + windowMs });
            next();
            return;
        }

        if (bucket.count >= max) {
            throw new AppError(message, 429);
        }

        bucket.count += 1;
        next();
    };
};

/**
 * Áp dụng chung cho /auth/login, /auth/register, /auth/refresh: cùng một
 * bộ đếm theo IP, tối đa 10 lần mỗi 15 phút trên cả ba tuyến cộng lại.
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10
});
