import { Router } from 'express';
import { createScanItem, getScanItems } from '../controllers/scanItem.controller';

const router = Router();

router.post('/', createScanItem);
router.get('/', getScanItems);

export default router;