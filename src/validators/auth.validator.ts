import { z } from 'zod';

export const registerSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email format')
        .trim()
        .toLowerCase(),
    password: z
        .string({ error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters'),
    full_name: z
        .string({ error: 'Full name is required' })
        .trim()
        .min(1, 'Full name cannot be empty'),
    phone: z.string().trim().optional()
});

export const loginSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email format')
        .trim()
        .toLowerCase(),
    password: z.string({ error: 'Password is required' })
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
