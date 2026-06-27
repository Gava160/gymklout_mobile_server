import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { workoutsService } from './workouts.service';

export class WorkoutsController {
  async startWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await workoutsService.startWorkout(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async finishWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const data = await workoutsService.finishWorkout(req.user!.id, workoutId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getActiveWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await workoutsService.getActiveWorkout(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getWorkoutHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        gymId: req.query.gymId as string | undefined,
      };
      const data = await workoutsService.getWorkoutHistory(req.user!.id, input);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getWorkoutById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const data = await workoutsService.getWorkoutById(req.user!.id, workoutId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const data = await workoutsService.deleteWorkout(req.user!.id, workoutId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async addSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const data = await workoutsService.addSet(req.user!.id, workoutId, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const setId = req.params.setId as string;
      const data = await workoutsService.updateSet(req.user!.id, workoutId, setId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteSet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workoutId = req.params.workoutId as string;
      const setId = req.params.setId as string;
      const data = await workoutsService.deleteSet(req.user!.id, workoutId, setId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getExercises(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const muscleGroup = req.query.muscleGroup as string | undefined;
      const equipment = req.query.equipment as string | undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const data = await workoutsService.getExercises(muscleGroup, equipment, difficulty);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await workoutsService.createExercise(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getWorkoutPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const gymId = req.query.gymId as string | undefined;
      const data = await workoutsService.getWorkoutPlans(gymId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createWorkoutPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await workoutsService.createWorkoutPlan(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getWorkoutStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await workoutsService.getWorkoutStats(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const workoutsController = new WorkoutsController();