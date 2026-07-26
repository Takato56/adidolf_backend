import { z } from 'zod';
import { generateSlug, slugPattern } from '../utils/slug.utils.js';

export { generateSlug };

export const createCategorySchema = z.object({
    name: z
        .string({ error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),
    slug: z
        .string()
        .trim()
        .regex(
            slugPattern,
            'Slug must be lowercase alphanumeric with hyphens only'
        )
        .optional(),
    description: z.string().trim().optional(),
    image_url: z.string().url('Invalid image URL').optional()
});

export const updateCategorySchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be at most 50 characters')
            .optional(),
        slug: z
            .string()
            .trim()
            .regex(
                slugPattern,
                'Slug must be lowercase alphanumeric with hyphens only'
            )
            .optional(),
        description: z.string().trim().optional(),
        image_url: z.string().url('Invalid image URL').optional()
    })
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const categoryIdSchema = z.coerce
    .number({ error: 'Invalid category ID' })
    .int('Category ID must be an integer')
    .positive('Category ID must be positive');
