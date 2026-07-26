import { z } from 'zod';

export const createReviewSchema = z
    .object({
        rating: z.coerce
            .number({ error: 'rating is required' })
            .int('rating must be an integer')
            .min(1, 'rating must be between 1 and 5')
            .max(5, 'rating must be between 1 and 5'),
        comment: z
            .string()
            .trim()
            .max(2000, 'comment must be at most 2000 characters')
            .optional(),
        order_item_id: z.coerce.number().int().positive().optional()
    })
    .strict();

export const updateReviewSchema = z
    .object({
        rating: z.coerce
            .number()
            .int('rating must be an integer')
            .min(1, 'rating must be between 1 and 5')
            .max(5, 'rating must be between 1 and 5')
            .optional(),
        comment: z
            .string()
            .trim()
            .max(2000, 'comment must be at most 2000 characters')
            .optional()
    })
    .strict()
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const approveReviewSchema = z
    .object({
        is_approved: z.boolean({ error: 'is_approved is required' })
    })
    .strict();

export const reviewIdSchema = z.coerce
    .number({ error: 'Invalid review ID' })
    .int('Review ID must be an integer')
    .positive('Review ID must be positive');

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ApproveReviewInput = z.infer<typeof approveReviewSchema>;
