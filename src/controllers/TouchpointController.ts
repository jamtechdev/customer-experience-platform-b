import { Request, Response, NextFunction } from 'express';
import { TouchpointService } from '../services/TouchpointService';
import { body, validationResult } from 'express-validator';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  serverErrorHandler,
  validationErrorHandler,
} from '../utils/responseHandler';

export class TouchpointController {
  private touchpointService: TouchpointService;

  constructor() {
    this.touchpointService = container.get<TouchpointService>(TYPES.TouchpointService);
  }

  getTouchpoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const touchpoints = await this.touchpointService.getTouchpoints();
      successHandler(res, touchpoints, 200, 'Touchpoints retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getTouchpointPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const touchpointId = parseInt(req.params.id);
      const performance = await this.touchpointService.getTouchpointPerformance(touchpointId);
      successHandler(res, performance, 200, 'Touchpoint performance retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  createTouchpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const touchpoint = await this.touchpointService.createTouchpoint(req.body);
      successHandler(res, touchpoint, 201, 'Touchpoint created successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}

export const touchpointValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('order').isInt().withMessage('Order must be an integer'),
];
