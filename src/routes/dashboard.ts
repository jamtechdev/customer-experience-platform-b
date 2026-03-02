import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/executive', authenticate, dashboardController.getExecutiveDashboard);
router.get('/sentiment', authenticate, dashboardController.getSentimentOverview);
router.get('/nps', authenticate, dashboardController.getNPSDashboard);
router.get('/competitor', authenticate, dashboardController.getCompetitorComparison);
router.get('/root-causes', authenticate, dashboardController.getRootCauseSummary);
router.get('/journey', authenticate, dashboardController.getJourneyHeatmap);
router.get('/alerts', authenticate, dashboardController.getAlertPanel);

export default router;
