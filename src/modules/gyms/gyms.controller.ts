import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { gymsService } from './gyms.service';

export class GymsController {
  async getNearbyGyms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = {
        latitude: parseFloat(req.query.latitude as string),
        longitude: parseFloat(req.query.longitude as string),
        radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const data = await gymsService.getNearbyGyms(input);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getGymsByCity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = {
        city: req.query.city as string,
        state: req.query.state as string | undefined,
        country: req.query.country as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const data = await gymsService.getGymsByCity(input);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async searchGyms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = {
        query: req.query.q as string,
        city: req.query.city as string | undefined,
        state: req.query.state as string | undefined,
        country: req.query.country as string | undefined,
        amenities: req.query.amenities
          ? (req.query.amenities as string).split(',')
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const data = await gymsService.searchGyms(input);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

async getGymById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const gymId = req.params.gymId as string;
    const data = await gymsService.getGymById(gymId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async getGymMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const gymId = req.params.gymId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const data = await gymsService.getGymMembers(gymId, limit, offset);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
}

export const gymsController = new GymsController();