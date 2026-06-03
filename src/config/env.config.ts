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
    // JWT env
    JWT_SECRET: required('JWT_SECRET'),
    JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
    JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '15m'),
    JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
    // Token
    ACCESS_TOKEN_EXPIRES_IN: optional('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    REFRESH_TOKEN_EXPIRES_IN: optional('REFRESH_TOKEN_EXPIRES_IN', '7d'),

    // Helpers
    get isDev()  { return this.NODE_ENV === 'development'; },
    get isProd() { return this.NODE_ENV === 'production'; },
} as const;