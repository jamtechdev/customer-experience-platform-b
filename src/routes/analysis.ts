import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
import { authenticate } from '../middleware/auth';

const router = Router();
const analysisController = new AnalysisController();

router.post('/sentiment', authenticate, analysisController.analyzeSentiment);
router.get('/sentiment', authenticate, analysisController.getSentimentStats);
router.post('/nps', authenticate, analysisController.analyzeNPS);
router.get('/nps', authenticate, analysisController.getNPSTrends);
router.post('/root-cause', authenticate, analysisController.analyzeRootCauses);
router.get('/root-cause', authenticate, analysisController.getRootCauses);
router.get('/competitor', authenticate, analysisController.getCompetitorAnalysis);

export default router;
