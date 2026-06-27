import { z } from 'zod';

export const startWorkoutSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID').optional(),
  planId: z.string().uuid('Invalid plan ID').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const finishWorkoutSchema = z.object({
  notes: z.string().max(500, 'Notes too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
});

export const addSetSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  setNumber: z.number().int().min(1, 'Set number must be at least 1'),
  reps: z.number().int().min(1).max(9999).optional(),
  weightKg: z.number().min(0).max(9999).optional(),
  durationSec: z.number().int().min(1).optional(),
  restSec: z.number().int().min(0).optional(),
  notes: z.string().max(200).optional(),
});

export const updateSetSchema = z.object({
  reps: z.number().int().min(1).max(9999).optional(),
  weightKg: z.number().min(0).max(9999).optional(),
  durationSec: z.number().int().min(1).optional(),
  restSec: z.number().int().min(0).optional(),
  notes: z.string().max(200).optional(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100, 'Name too long').trim(),
  description: z.string().max(500).optional(),
  muscleGroup: z.enum([
    'chest', 'back', 'shoulders', 'arms',
    'legs', 'glutes', 'core', 'cardio', 'full_body',
  ]).optional(),
  equipment: z.enum([
    'barbell', 'dumbbell', 'machine', 'cable',
    'bodyweight', 'resistance_band', 'other',
  ]).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  isPublic: z.boolean().default(true),
});

export const createWorkoutPlanSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID').optional(),
  title: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  goal: z.enum(['lose_weight', 'build_muscle', 'maintain', 'endurance']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  isPublic: z.boolean().default(true),
});

export const listWorkoutsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  gymId: z.string().uuid().optional(),
});

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
export type FinishWorkoutInput = z.infer<typeof finishWorkoutSchema>;
export type AddSetInput = z.infer<typeof addSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;
export type ListWorkoutsInput = z.infer<typeof listWorkoutsSchema>;