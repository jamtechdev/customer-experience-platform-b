import { Router } from 'express';
import authRoutes from './auth';
import csvRoutes from './csv';
import analysisRoutes from './analysis';
import recommendationRoutes from './recommendations';
import alertRoutes from './alerts';
import touchpointRoutes from './touchpoints';
import journeyRoutes from './journey';
import dashboardRoutes from './dashboard';
import settingsRoutes from './settings';

const router = Router();

router.use('/auth', authRoutes);
router.use('/csv', csvRoutes);
router.use('/analysis', analysisRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/alerts', alertRoutes);
router.use('/touchpoints', touchpointRoutes);
router.use('/journey', journeyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;
