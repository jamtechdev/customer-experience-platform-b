import { Router } from 'express';
import { AuthController, registerValidation, loginValidation } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', authenticate, authController.getProfile);

export default router;
