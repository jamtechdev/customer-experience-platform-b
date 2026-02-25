import { Router } from 'express';
import { 
  AuthController, 
  registerValidation, 
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);

export default router;
