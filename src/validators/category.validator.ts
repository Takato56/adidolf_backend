import { z } from 'zod';

// ─── Helpers ──────────────────────────────────────────────

/**
 * Convert a category name into a URL-friendly slug.
 * e.g. "Áo Thun Nam" → "ao-thun-nam"
 */
export const generateSlug = (name: string): string => {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric
        .replace(/[\s_]+/g, '-') // spaces/underscores → hyphens
        .replace(/-+/g, '-') // collapse multiple hyphens
        .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── Schemas ──────────────────────────────────────────────

export const createCategorySchema = z.object({
    name: z
        .string({ error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),
    slug: z
        .string()
        .trim()
        .regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens only')
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
        (data) => Object.values(data).some((v) => v !== undefined),
        'At least one field must be provided'
    );

export const categoryIdSchema = z.coerce
    .number({ error: 'Invalid category ID' })
    .int('Category ID must be an integer')
    .positive('Category ID must be positive');
