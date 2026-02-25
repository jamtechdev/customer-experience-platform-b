import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import container from '../config/container';
import { TYPES } from '../config/types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = container.get<AuthService>(TYPES.AuthService);
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
        return;
      }

      const result = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
        return;
      }

      const result = await this.authService.login(req.body);
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  };

  getProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });
    } catch (error: any) {
      next(error);
    }
  };
}

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
