import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { workoutsController } from './workouts.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  startWorkoutSchema,
  finishWorkoutSchema,
  addSetSchema,
  updateSetSchema,
  createExerciseSchema,
  createWorkoutPlanSchema,
} from './workouts.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const workoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many workout requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const setLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,           // sets get logged fast during a workout
  message: { success: false, error: 'Too many set requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes protected ─────────────────────────────────────────────────────
router.use(authenticate);

// Stats
router.get('/stats', workoutsController.getWorkoutStats);

// Active workout
router.get('/active', workoutsController.getActiveWorkout);

// Workout history
router.get('/history', workoutsController.getWorkoutHistory);

// Workout CRUD
router.post('/', workoutLimiter, validate(startWorkoutSchema), workoutsController.startWorkout);
router.get('/:workoutId', workoutsController.getWorkoutById);
router.patch('/:workoutId/finish', validate(finishWorkoutSchema), workoutsController.finishWorkout);
router.delete('/:workoutId', workoutsController.deleteWorkout);

// Sets
router.post('/:workoutId/sets', setLimiter, validate(addSetSchema), workoutsController.addSet);
router.patch('/:workoutId/sets/:setId', setLimiter, validate(updateSetSchema), workoutsController.updateSet);
router.delete('/:workoutId/sets/:setId', workoutsController.deleteSet);

// Exercises library
router.get('/exercises/all', workoutsController.getExercises);
router.post('/exercises', validate(createExerciseSchema), workoutsController.createExercise);

// Workout plans
router.get('/plans/all', workoutsController.getWorkoutPlans);
router.post('/plans', validate(createWorkoutPlanSchema), workoutsController.createWorkoutPlan);

export default router;