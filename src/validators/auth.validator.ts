import { z } from 'zod';

export const registerSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Invalid email format'),
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
        .trim()
        .toLowerCase()
        .email('Invalid email format'),
    password: z.string({ error: 'Password is required' })
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
