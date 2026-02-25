import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticate } from '../middleware/auth';
import container from '../config/container';
import { TYPES } from '../config/types';
import { SettingsService } from '../services/SettingsService';

const router = Router();
const settingsService = container.get<SettingsService>(TYPES.SettingsService);
const settingsController = new SettingsController(settingsService);

router.get('/', authenticate, settingsController.getSettings);
router.put('/', authenticate, settingsController.updateSettings);
router.delete('/', authenticate, settingsController.deleteSettings);

export default router;
