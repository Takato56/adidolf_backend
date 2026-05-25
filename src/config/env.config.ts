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
    PORT: optional('PORT', '3000'),
    SUPABASE_URL: optional('SUPABASE_URL', 'localhost'),
    SUPABASE_ANON_KEY: optional('SUPABASE_ANON_KEY', 'localhost'),
    FRONTEND_URL: optional('FRONTEND_URL', 'localhost'),
} as const;