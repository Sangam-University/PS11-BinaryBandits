import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  aiMatchPercentage,
  aiBestMatch,
} from '../controllers/aiController.js';

const router = Router();

router.use(authenticate);

router.post('/match-percentage', aiMatchPercentage);
router.post('/best-match', aiBestMatch);

export default router;
