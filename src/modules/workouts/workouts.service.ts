import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  StartWorkoutInput,
  FinishWorkoutInput,
  AddSetInput,
  UpdateSetInput,
  CreateExerciseInput,
  CreateWorkoutPlanInput,
  ListWorkoutsInput,
} from './workouts.schemas';

export class WorkoutsService {
  // ─── Start a Workout ──────────────────────────────────────────────────────────
  async startWorkout(userId: string, input: StartWorkoutInput) {
    // Check user doesn't already have an active workout
    const { data: active } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .is('ended_at', null)
      .maybeSingle();

    if (active) {
      throw new AppError(409, 'You already have an active workout. Finish it before starting a new one.');
    }

    // If gymId provided, verify membership
    if (input.gymId) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('gym_id', input.gymId)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        throw new AppError(403, 'You must be a member of this gym to log a workout here');
      }
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        gym_id: input.gymId ?? null,
        plan_id: input.planId ?? null,
        title: input.title ?? null,
        notes: input.notes ?? null,
        started_at: new Date().toISOString(),
      })
      .select(`
        id, user_id, gym_id, plan_id, title, notes,
        started_at, ended_at, duration_sec,
        created_at, updated_at,
        gyms ( id, name, logo_url, city ),
        workout_plans ( id, title, goal, level )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to start workout');
    }

    return data;
  }

  // ─── Finish a Workout ─────────────────────────────────────────────────────────
  async finishWorkout(userId: string, workoutId: string, input: FinishWorkoutInput) {
    const { data: workout } = await supabase
      .from('workouts')
      .select('id, started_at, ended_at')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    if (workout.ended_at) {
      throw new AppError(400, 'Workout is already finished');
    }

    const endedAt = new Date();
    const startedAt = new Date(workout.started_at);
    const durationSec = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const { data, error } = await supabase
      .from('workouts')
      .update({
        ended_at: endedAt.toISOString(),
        duration_sec: durationSec,
        title: input.title ?? null,
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workoutId)
      .select(`
        id, user_id, gym_id, plan_id, title, notes,
        started_at, ended_at, duration_sec,
        created_at, updated_at,
        workout_sets (
          id, set_number, reps, weight_kg, duration_sec, rest_sec, notes,
          exercises ( id, name, muscle_group, equipment )
        )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to finish workout');
    }

    return data;
  }

  // ─── Get Active Workout ───────────────────────────────────────────────────────
  async getActiveWorkout(userId: string) {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id, user_id, gym_id, plan_id, title, notes,
        started_at, ended_at, duration_sec,
        created_at, updated_at,
        gyms ( id, name, logo_url, city ),
        workout_plans ( id, title, goal, level ),
        workout_sets (
          id, set_number, reps, weight_kg, duration_sec, rest_sec, notes,
          created_at,
          exercises ( id, name, muscle_group, equipment, thumbnail_url )
        )
      `)
      .eq('user_id', userId)
      .is('ended_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'Failed to fetch active workout');
    }

    return data;
  }

  // ─── Get Workout History ──────────────────────────────────────────────────────
  async getWorkoutHistory(userId: string, input: ListWorkoutsInput) {
    const { limit, offset, gymId } = input;

    let query = supabase
      .from('workouts')
      .select(`
        id, user_id, gym_id, plan_id, title, notes,
        started_at, ended_at, duration_sec,
        created_at, updated_at,
        gyms ( id, name, logo_url, city ),
        workout_sets ( id, set_number, reps, weight_kg )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    if (gymId) query = query.eq('gym_id', gymId);

    const { data, error, count } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, 'Failed to fetch workout history');
    }

    return {
      workouts: data ?? [],
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    };
  }

  // ─── Get Single Workout ───────────────────────────────────────────────────────
  async getWorkoutById(userId: string, workoutId: string) {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id, user_id, gym_id, plan_id, title, notes,
        started_at, ended_at, duration_sec,
        created_at, updated_at,
        gyms ( id, name, logo_url, city ),
        workout_plans ( id, title, goal, level ),
        workout_sets (
          id, set_number, reps, weight_kg, duration_sec, rest_sec, notes,
          created_at,
          exercises ( id, name, muscle_group, equipment, thumbnail_url )
        )
      `)
      .eq('id', workoutId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Workout not found');
    }

    return data;
  }

  // ─── Delete Workout ───────────────────────────────────────────────────────────
  async deleteWorkout(userId: string, workoutId: string) {
    const { data: workout } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);

    if (error) {
      throw new AppError(500, 'Failed to delete workout');
    }

    return { message: 'Workout deleted successfully' };
  }

  // ─── Add Set to Workout ───────────────────────────────────────────────────────
  async addSet(userId: string, workoutId: string, input: AddSetInput) {
    // Verify workout belongs to user and is still active
    const { data: workout } = await supabase
      .from('workouts')
      .select('id, ended_at')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    if (workout.ended_at) {
      throw new AppError(400, 'Cannot add sets to a finished workout');
    }

    // Verify exercise exists
    const { data: exercise } = await supabase
      .from('exercises')
      .select('id')
      .eq('id', input.exerciseId)
      .maybeSingle();

    if (!exercise) {
      throw new AppError(404, 'Exercise not found');
    }

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_id: workoutId,
        exercise_id: input.exerciseId,
        set_number: input.setNumber,
        reps: input.reps ?? null,
        weight_kg: input.weightKg ?? null,
        duration_sec: input.durationSec ?? null,
        rest_sec: input.restSec ?? null,
        notes: input.notes ?? null,
      })
      .select(`
        id, workout_id, exercise_id, set_number,
        reps, weight_kg, duration_sec, rest_sec, notes, created_at,
        exercises ( id, name, muscle_group, equipment, thumbnail_url )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to add set');
    }

    return data;
  }

  // ─── Update Set ───────────────────────────────────────────────────────────────
  async updateSet(userId: string, workoutId: string, setId: string, input: UpdateSetInput) {
    // Verify ownership through workout
    const { data: workout } = await supabase
      .from('workouts')
      .select('id, ended_at')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    if (workout.ended_at) {
      throw new AppError(400, 'Cannot edit sets on a finished workout');
    }

    const updateData: Record<string, unknown> = {};
    if (input.reps !== undefined)        updateData['reps']         = input.reps;
    if (input.weightKg !== undefined)    updateData['weight_kg']    = input.weightKg;
    if (input.durationSec !== undefined) updateData['duration_sec'] = input.durationSec;
    if (input.restSec !== undefined)     updateData['rest_sec']     = input.restSec;
    if (input.notes !== undefined)       updateData['notes']        = input.notes;

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, 'No fields provided to update');
    }

    const { data, error } = await supabase
      .from('workout_sets')
      .update(updateData)
      .eq('id', setId)
      .eq('workout_id', workoutId)
      .select(`
        id, workout_id, exercise_id, set_number,
        reps, weight_kg, duration_sec, rest_sec, notes, created_at,
        exercises ( id, name, muscle_group, equipment )
      `)
      .single();

    if (error || !data) {
      throw new AppError(500, 'Failed to update set');
    }

    return data;
  }

  // ─── Delete Set ───────────────────────────────────────────────────────────────
  async deleteSet(userId: string, workoutId: string, setId: string) {
    const { data: workout } = await supabase
      .from('workouts')
      .select('id, ended_at')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    if (workout.ended_at) {
      throw new AppError(400, 'Cannot delete sets from a finished workout');
    }

    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', setId)
      .eq('workout_id', workoutId);

    if (error) {
      throw new AppError(500, 'Failed to delete set');
    }

    return { message: 'Set deleted successfully' };
  }

  // ─── Exercises Library ────────────────────────────────────────────────────────
  async getExercises(muscleGroup?: string, equipment?: string, difficulty?: string) {
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('is_public', true);

    if (muscleGroup) query = query.eq('muscle_group', muscleGroup);
    if (equipment)   query = query.eq('equipment', equipment);
    if (difficulty)  query = query.eq('difficulty', difficulty);

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      throw new AppError(500, 'Failed to fetch exercises');
    }

    return data ?? [];
  }

  async createExercise(userId: string, input: CreateExerciseInput) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        created_by: userId,
        name: input.name,
        description: input.description ?? null,
        muscle_group: input.muscleGroup ?? null,
        equipment: input.equipment ?? null,
        difficulty: input.difficulty ?? null,
        video_url: input.videoUrl ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
        is_public: input.isPublic,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(500, 'Failed to create exercise');
    }

    return data;
  }

  // ─── Workout Plans ────────────────────────────────────────────────────────────
  async getWorkoutPlans(gymId?: string) {
    let query = supabase
      .from('workout_plans')
      .select(`
        id, gym_id, created_by, title, description,
        goal, level, duration_weeks, is_public,
        created_at, updated_at,
        gyms ( id, name, logo_url )
      `)
      .eq('is_public', true);

    if (gymId) query = query.eq('gym_id', gymId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch workout plans');
    }

    return data ?? [];
  }

  async createWorkoutPlan(userId: string, input: CreateWorkoutPlanInput) {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        created_by: userId,
        gym_id: input.gymId ?? null,
        title: input.title,
        description: input.description ?? null,
        goal: input.goal ?? null,
        level: input.level ?? null,
        duration_weeks: input.durationWeeks ?? null,
        is_public: input.isPublic,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(500, 'Failed to create workout plan');
    }

    return data;
  }

  // ─── Workout Stats ────────────────────────────────────────────────────────────
  async getWorkoutStats(userId: string) {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, duration_sec, started_at, workout_sets(reps, weight_kg)')
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    if (error) {
      throw new AppError(500, 'Failed to fetch workout stats');
    }

    const workouts = data ?? [];
    const totalWorkouts = workouts.length;
    const totalDurationSec = workouts.reduce((sum, w) => sum + (w.duration_sec ?? 0), 0);
    const totalSets = workouts.reduce((sum, w) => sum + (w.workout_sets?.length ?? 0), 0);
    const totalVolumeKg = workouts.reduce((sum, w) => {
      const vol = (w.workout_sets ?? []).reduce((s: number, set: any) => {
        return s + ((set.reps ?? 0) * (set.weight_kg ?? 0));
      }, 0);
      return sum + vol;
    }, 0);

    return {
      totalWorkouts,
      totalDurationSec,
      totalSets,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    };
  }
}

export const workoutsService = new WorkoutsService();