import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { membershipsService } from './memberships.service';

export class MembershipsController {
  async joinGym(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.joinGym(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async leaveGym(req: AuthRequest, res: Response, next: NextFunction) {
     const requestId = req.params.requestId as string;
    try {
      const data = await membershipsService.leaveGym(
        req.user!.id,
        requestId
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMyMemberships(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.getMyMemberships(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async sendPartnerRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.sendPartnerRequest(
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async respondToPartnerRequest(req: AuthRequest, res: Response, next: NextFunction) {
    const requestId = req.params.requestId as string;
    try {
      const data = await membershipsService.respondToPartnerRequest(
        req.user!.id,
        requestId,
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getIncomingRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.getIncomingRequests(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSentRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.getSentRequests(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMyPartners(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await membershipsService.getMyPartners(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

 async cancelPartnerRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = req.params.requestId as string;
    const data = await membershipsService.cancelPartnerRequest(
      req.user!.id,
      requestId
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
}

export const membershipsController = new MembershipsController();