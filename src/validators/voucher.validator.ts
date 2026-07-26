import { z } from 'zod';

export const validateVoucherSchema = z
    .object({
        code: z
            .string({ error: 'code is required' })
            .trim()
            .min(1, 'code is required')
            .max(50, 'code must be at most 50 characters')
    })
    .strict();

export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>;
