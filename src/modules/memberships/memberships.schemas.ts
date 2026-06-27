import { z } from 'zod';

export const joinGymSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID'),
});

export const leaveGymSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID'),
});

export const sendPartnerRequestSchema = z.object({
  receiverId: z.string().uuid('Invalid user ID'),
  gymId: z.string().uuid('Invalid gym ID'),
});

export const respondPartnerRequestSchema = z.object({
  status: z.enum(['accepted', 'declined'], {
    error: "Status must be 'accepted' or 'declined'",
  }),
});

export const getMembersSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export type JoinGymInput = z.infer<typeof joinGymSchema>;
export type LeaveGymInput = z.infer<typeof leaveGymSchema>;
export type SendPartnerRequestInput = z.infer<typeof sendPartnerRequestSchema>;
export type RespondPartnerRequestInput = z.infer<typeof respondPartnerRequestSchema>;
export type GetMembersInput = z.infer<typeof getMembersSchema>;