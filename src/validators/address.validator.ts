import { z } from 'zod';

export const createAddressSchema = z
    .object({
        recipient_name: z
            .string({ error: 'recipient_name is required' })
            .trim()
            .min(1, 'recipient_name cannot be empty')
            .max(150, 'recipient_name must be at most 150 characters'),
        phone: z
            .string({ error: 'phone is required' })
            .trim()
            .min(8, 'phone must be at least 8 characters')
            .max(20, 'phone must be at most 20 characters'),
        address_details: z
            .string({ error: 'address_details is required' })
            .trim()
            .min(1, 'address_details cannot be empty')
            .max(500, 'address_details must be at most 500 characters'),
        is_default: z.boolean().optional()
    })
    .strict();

export const updateAddressSchema = z
    .object({
        recipient_name: z
            .string()
            .trim()
            .min(1, 'recipient_name cannot be empty')
            .max(150, 'recipient_name must be at most 150 characters')
            .optional(),
        phone: z
            .string()
            .trim()
            .min(8, 'phone must be at least 8 characters')
            .max(20, 'phone must be at most 20 characters')
            .optional(),
        address_details: z
            .string()
            .trim()
            .min(1, 'address_details cannot be empty')
            .max(500, 'address_details must be at most 500 characters')
            .optional(),
        is_default: z.boolean().optional()
    })
    .strict()
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        'At least one field must be provided'
    );

export const addressIdParamSchema = z.coerce
    .number({ error: 'Invalid address ID' })
    .int('Address ID must be an integer')
    .positive('Address ID must be positive');

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
