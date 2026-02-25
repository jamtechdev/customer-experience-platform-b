import { Router } from 'express';
import { TouchpointController, touchpointValidation } from '../controllers/TouchpointController';
import { authenticate } from '../middleware/auth';

const router = Router();
const touchpointController = new TouchpointController();

router.get('/', authenticate, touchpointController.getTouchpoints);
router.get('/:id/performance', authenticate, touchpointController.getTouchpointPerformance);
router.post('/', authenticate, touchpointValidation, touchpointController.createTouchpoint);

export default router;
