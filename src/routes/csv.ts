import { Router } from 'express';
import { CSVController, mappingValidation } from '../controllers/CSVController';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();
const csvController = new CSVController();

router.post('/upload', authenticate, upload.single('file'), csvController.upload);
router.get('/imports', authenticate, csvController.getImports);
router.get('/imports/:importId', authenticate, csvController.getImportStatus);
router.post('/mappings', authenticate, mappingValidation, csvController.createMapping);
router.get('/mappings', authenticate, csvController.getMappings);
router.get('/:importId/preview', authenticate, csvController.preview);
router.post('/:importId/process', authenticate, csvController.processImport);

export default router;
