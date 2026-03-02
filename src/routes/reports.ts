import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate } from '../middleware/auth';

const router = Router();
const reportController = new ReportController();

router.get('/', authenticate, reportController.getReports);
router.get('/:id', authenticate, reportController.getReportById);
router.post('/', authenticate, reportController.createReport);

export default router;
