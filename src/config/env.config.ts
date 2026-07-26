import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const optional = (key: string, defaultValue: string): string => {
    return process.env[key] ?? defaultValue;
};

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: optional('PORT', '3000'),
    FRONTEND_URL: optional('FRONTEND_URL', 'localhost:3000'),
    // Database env
    SUPABASE_URL: optional('SUPABASE_URL', 'localhost'),
    SUPABASE_ANON_KEY: optional('SUPABASE_ANON_KEY', 'localhost'),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_PRODUCT_IMAGE_BUCKET: optional(
        'SUPABASE_PRODUCT_IMAGE_BUCKET',
        'product-images'
    ),
    // JWT env
    JWT_SECRET: required('JWT_SECRET'),
    JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
    JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '15m'),
    JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

    // Helpers
    get REFRESH_TOKEN_MAX_AGE() {
        const expiresIn = this.JWT_REFRESH_EXPIRES_IN;
        const value = parseInt(expiresIn);
        const unit = expiresIn.slice(-1).toLowerCase();

        switch (unit) {
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'm':
                return value * 60 * 1000;
            case 's':
                return value * 1000;
            default:
                return value; // Assume ms if no unit
        }
    },
    get isDev() {
        return this.NODE_ENV === 'development';
    },
    get isProd() {
        return this.NODE_ENV === 'production';
    }
} as const;
