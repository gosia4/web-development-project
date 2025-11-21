"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAverageNutritionScore = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAverageNutritionScore = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error retrieving average nutrition scores:', error);
        res.status(500).json({ error: 'Error retrieving items' });
    }
};
exports.getAverageNutritionScore = getAverageNutritionScore;
