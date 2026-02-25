import { Router } from 'express';
import { JourneyController } from '../controllers/JourneyController';
import { authenticate } from '../middleware/auth';

const router = Router();
const journeyController = new JourneyController();

router.get('/stages', authenticate, journeyController.getStages);
router.get('/analysis', authenticate, journeyController.analyzeJourney);
router.get('/trends', authenticate, journeyController.getJourneyTrends);

export default router;
