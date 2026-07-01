import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { visitsService } from './visits.service';

export class VisitsController {
  async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await visitsService.checkIn(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const month = req.query.month as string | undefined;
      const visitedDates = await visitsService.getVisitHistory(req.user!.id, month);
      res.status(200).json({ success: true, data: { visitedDates } });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await visitsService.getVisitStats(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const visitsController = new VisitsController();