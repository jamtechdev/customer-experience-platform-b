import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { authenticate } from '../middleware/auth';

const router = Router();
const alertController = new AlertController();

router.get('/', authenticate, alertController.getAlerts);
router.post('/:id/acknowledge', authenticate, alertController.acknowledgeAlert);
router.post('/check', authenticate, alertController.checkAlerts);

export default router;
