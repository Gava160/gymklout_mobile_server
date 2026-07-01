import { z } from 'zod';

export const checkInSchema = z.object({
  gymId: z.string().uuid({ error: 'Invalid gym ID' }),
});

export const visitHistoryQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, { error: 'Month must be in YYYY-MM format' })
    .optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type VisitHistoryQuery = z.infer<typeof visitHistoryQuerySchema>;