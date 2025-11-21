import { Router } from 'express';
import { getAverageNutritionScore } from '../controllers/nutritionScore.controller';

const router = Router();

router.get('/average', getAverageNutritionScore);

export default router;