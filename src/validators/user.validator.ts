import { z } from 'zod';

export const updateProfileSchema = z
    .object({
        full_name: z.string().trim().min(1).max(150).optional(),
        phone: z.string().trim().min(8).max(20).optional(),
        avatar_url: z.string().url('Invalid avatar URL').optional()
    })
    .strict()
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const changePasswordSchema = z
    .object({
        old_password: z
            .string({ error: 'old_password is required' })
            .min(1, 'old_password is required'),
        new_password: z
            .string({ error: 'new_password is required' })
            .min(8, 'Password must be at least 8 characters')
    })
    .strict()
    .refine((data) => data.old_password !== data.new_password, {
        message: 'New password must be different from old password',
        path: ['new_password']
    });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
