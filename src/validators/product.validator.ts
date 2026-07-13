import { z } from 'zod';
import { slugPattern } from '../utils/slug.utils.js';

const emptyToUndefined = (value: unknown): unknown =>
    value === '' ? undefined : value;

const optionalUrl = z.preprocess(
    emptyToUndefined,
    z.string().url('Invalid image URL').optional()
);

const optionalText = z.preprocess(
    emptyToUndefined,
    z.string().trim().optional()
);

const booleanish = z.preprocess((value) => {
    if (typeof value !== 'string') return value;

    const normalized = value.toLowerCase().trim();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return value;
}, z.boolean());

export const productIdSchema = z.coerce
    .number({ error: 'Invalid product ID' })
    .int('Product ID must be an integer')
    .positive('Product ID must be positive');

export const productImageIdSchema = z.coerce
    .number({ error: 'Invalid product image ID' })
    .int('Product image ID must be an integer')
    .positive('Product image ID must be positive');

export const productImageSchema = z.object({
    image_url: z.string().url('Invalid image URL'),
    alt_text: optionalText.nullish(),
    is_primary: booleanish.optional(),
    sort_order: z.coerce.number().int().min(0).optional()
});

export const updateProductImageSchema = z
    .object({
        image_url: optionalUrl,
        alt_text: optionalText.nullish(),
        is_primary: booleanish.optional(),
        sort_order: z.coerce.number().int().min(0).optional()
    })
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const createProductImagesSchema = z
    .union([
        z.object({
            images: z.array(productImageSchema).min(1)
        }),
        productImageSchema
    ])
    .transform((value) => ('images' in value ? value.images : [value]));

export const createProductSchema = z.object({
    category_id: z.coerce.number().int().positive(),
    name: z
        .string({ error: 'Product name is required' })
        .trim()
        .min(2, 'Product name must be at least 2 characters')
        .max(150, 'Product name must be at most 150 characters'),
    slug: z
        .string()
        .trim()
        .regex(
            slugPattern,
            'Slug must be lowercase alphanumeric with hyphens only'
        )
        .optional(),
    description: optionalText.nullish(),
    base_price: z.coerce.number().min(0),
    brand: optionalText.nullish(),
    is_published: booleanish.optional(),
    images: z.array(productImageSchema).optional()
});

export const updateProductSchema = z
    .object({
        category_id: z.coerce.number().int().positive().optional(),
        name: z
            .string()
            .trim()
            .min(2, 'Product name must be at least 2 characters')
            .max(150, 'Product name must be at most 150 characters')
            .optional(),
        slug: z
            .string()
            .trim()
            .regex(
                slugPattern,
                'Slug must be lowercase alphanumeric with hyphens only'
            )
            .optional(),
        description: optionalText.nullish(),
        base_price: z.coerce.number().min(0).optional(),
        brand: optionalText.nullish(),
        is_published: booleanish.optional()
    })
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const productFiltersSchema = z.object({
    category_id: z.coerce.number().int().positive().optional(),
    brand: z.string().trim().optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    search: z.string().trim().optional()
});
