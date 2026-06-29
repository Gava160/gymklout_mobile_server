import { z } from 'zod';

export const completeProfileSchema = z.object({
  fullName: z.string().min(2).max(50).trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
    .optional(),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date of birth')
    .refine(
      (val) => {
        const age = new Date().getFullYear() - new Date(val).getFullYear();
        return age >= 13 && age <= 120;
      },
      'You must be at least 13 years old'
    )
    .optional(),
  address: z.string().max(200, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(100, 'State name too long').optional(),
  country: z.string().max(100, 'Country name too long').optional(),
  completedProfileRegistration: z.boolean().optional(),
  weightKg: z
    .number()
    .min(20, 'Weight seems too low')
    .max(500, 'Weight seems too high')
    .optional(),
  heightCm: z
    .number()
    .min(50, 'Height seems too low')
    .max(300, 'Height seems too high')
    .optional(),
  goal: z.enum([
  'lose_weight',
  'build_muscle',
  'maintain',
  'endurance',
  'flexibility',
  'reduce_stress',
  'eat_healthier',
]).optional(),
age: z.number().min(13).max(120).optional(),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional(),

  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']).optional(),
  fitnessLevel: z.enum(['rookie', 'beginner', 'intermediate', 'advance', 'true_beast']).optional(),
  targetWeightKg: z.number().min(20).max(500).optional(),
  workoutFrequency: z.number().min(1).max(7).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50)
    .trim()
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date of birth')
    .optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  goal: z
    .enum(['lose_weight', 'build_muscle', 'maintain', 'endurance'])
    .optional(),
    age: z.number().min(13).max(120).optional(),
  bio: z.string().max(300).optional(),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']).optional(),
  fitnessLevel: z.enum(['rookie', 'beginner', 'intermediate', 'advance', 'true_beast']).optional(),
  targetWeightKg: z.number().min(20).max(500).optional(),
  workoutFrequency: z.number().min(1).max(7).optional(),
});

export const updatePinSchema = z
  .object({
    currentPin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must contain only numbers'),
    newPin: z
      .string()
      .length(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  })
  .refine((data) => data.currentPin !== data.newPin, {
    message: 'New PIN must be different from current PIN',
    path: ['newPin'],
  });

export const verifyPinSchema = z.object({
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;