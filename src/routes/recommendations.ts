import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { authenticate } from '../middleware/auth';

const router = Router();
const recommendationController = new RecommendationController();

router.post('/generate', authenticate, recommendationController.generateRecommendations);
router.get('/', authenticate, recommendationController.getRecommendations);

export default router;
