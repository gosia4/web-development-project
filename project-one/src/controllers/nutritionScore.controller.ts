import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAverageNutritionScore = async (req: Request, res: Response) => {
    try {
        const averageScores = await prisma.scanItem.groupBy({
            by: ['nutriScoreCategory'],
            _count: {
                id: true,
            },
        });

        const formattedScores = averageScores.map((score) => ({
            category: score.nutriScoreCategory,
            count: score._count.id,
        }));

        res.status(200).json(formattedScores);
    } catch (error) {
        console.error('Error retrieving average nutrition scores:', error);
        res.status(500).json({ error: 'Error retrieving items' });
    }
};