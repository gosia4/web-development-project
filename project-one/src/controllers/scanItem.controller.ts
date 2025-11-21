import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSocketIO } from '../socket';

const prisma = new PrismaClient();

export const createScanItem = async (req: Request, res: Response) => {
    const { name, ean, ecoScore, ecoScoreCategory, nutriScore, nutriScoreCategory, content, nutrition } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const newScanItem = await prisma.scanItem.create({
            data: {
                name: name || 'UNKNOWN',
                ean: ean || 'UNKNOWN',
                ecoScore: ecoScore !== undefined ? ecoScore : -1,
                ecoScoreCategory: ecoScoreCategory || 'UNKNOWN',
                nutriScore: nutriScore !== undefined ? nutriScore : -1,
                nutriScoreCategory: nutriScoreCategory || 'UNKNOWN',
                content: content || 'UNKNOWN',
                userId: userId,
                // nutrition: {
                //     create: nutrition
                //         ? Object.entries(nutrition).map(([nutrientName, nutrientValue]) => ({
                //               name: nutrientName,
                //               value: typeof nutrientValue === 'number' ? nutrientValue : -1,
                //           }))
                //         : [],
                // },
                nutrition: {
                    create: Array.isArray(nutrition)
                        ? nutrition.map((nutrient) => ({
                            name: nutrient.name || 'UNKNOWN',
                            value: typeof nutrient.value === 'number' ? nutrient.value : -1,
                        }))
                        : [],
                },

            },
            include: { nutrition: true },
        });

        // ---------------------------
        // 🔥 WYŚLIJ DO WSZYSTKICH KLIENTÓW
        // ---------------------------
        const io = getSocketIO();
        io.emit('newScanItem', newScanItem);

        console.log(`[Socket.IO] Emitted 'newScanItem' for item ID: ${newScanItem.id}`);

        res.status(200).json(newScanItem);

    } catch (error) {
        console.error('Error creating scan item:', error);
        res.status(500).json({ error: 'Error creating item' });
    }
};

export const getScanItems = async (req: Request, res: Response) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const scanItems = await prisma.scanItem.findMany({
            where: { userId },
            include: { nutrition: true },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(scanItems);
    } catch (error) {
        console.error('Error retrieving scan items:', error);
        res.status(500).json({ error: 'Error retrieving items' });
    }
};
