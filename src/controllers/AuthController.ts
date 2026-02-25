import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import container from '../config/container';
import { TYPES } from '../config/types';
import {
  successHandler,
  errorHandler,
  unauthorizedHandler,
  serverErrorHandler,
  validationErrorHandler,
} from '../utils/responseHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = container.get<AuthService>(TYPES.AuthService);
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const result = await this.authService.register(req.body);
      successHandler(res, result, 201, 'User registered successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const result = await this.authService.login(req.body);
      successHandler(res, result, 200, 'Login successful');
    } catch (error: any) {
      if (error instanceof AppError) {
        if (error.statusCode === 401) {
          unauthorizedHandler(res, error.message);
          return;
        }
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'User not authenticated');
        return;
      }

      const userData = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      };
      successHandler(res, userData, 200, 'Profile retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const result = await this.authService.forgotPassword(req.body);
      successHandler(res, null, 200, result.message);
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const result = await this.authService.resetPassword(req.body);
      successHandler(res, null, 200, result.message);
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
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

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
