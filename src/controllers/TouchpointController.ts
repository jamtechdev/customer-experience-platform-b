import { Request, Response, NextFunction } from 'express';
import { TouchpointService } from '../services/TouchpointService';
import { body, validationResult } from 'express-validator';
import container from '../config/container';
import { TYPES } from '../config/types';

export class TouchpointController {
  private touchpointService: TouchpointService;

  constructor() {
    this.touchpointService = container.get<TouchpointService>(TYPES.TouchpointService);
  }

  getTouchpoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const touchpoints = await this.touchpointService.getTouchpoints();
      res.json(touchpoints);
    } catch (error: any) {
      next(error);
    }
  };

  getTouchpointPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const touchpointId = parseInt(req.params.id);
      const performance = await this.touchpointService.getTouchpointPerformance(touchpointId);
      res.json(performance);
    } catch (error: any) {
      next(error);
    }
  };

  createTouchpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const touchpoint = await this.touchpointService.createTouchpoint(req.body);
      res.status(201).json(touchpoint);
    } catch (error: any) {
      next(error);
    }
  };
}

export const touchpointValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('order').isInt().withMessage('Order must be an integer'),
];
