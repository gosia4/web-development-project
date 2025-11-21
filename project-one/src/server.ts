import express from 'express';
import path from 'path';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
// import { PrismaSessionStore } from '@prisma/session-store'; // przestarzala forma, dlatego trzeba uzyc ponizszej
// import { PrismaSessionStore } from 'connect-prisma';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { createServer } from 'http';
import { initSocket, getSocketIO } from './socket';

import nutritionScoreRoutes from './routes/nutritionScore.route';
import scanItemRoutes from './routes/scanItem.route';

const app = express();
const port = 8000;
const prisma = new PrismaClient();

// Declaration merging
declare module 'express-session' {
    export interface SessionData {
        userId: number;
    }
}

// Warum: Socket.IO und Express sollen denselben Port nutzen
const httpServer = createServer(app);
initSocket(httpServer);

// Warum: Zum Parsen von JSON- und URL-kodierten Daten im Request-Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Warum: Für persistente Benutzersitzungen mit Prisma als Session Store
app.use(
    session({
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        },
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
            logger: undefined,
        }),
    })
);

// Warum: Sicherstellen, dass jeder Client eine userId in seiner Session hat
const loginMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
        try {
            const newUser = await prisma.user.create({ data: {} });
            req.session.userId = newUser.id;
            console.log(`[Session] New user created with ID: ${newUser.id} and assigned to session.`);
        } catch (error) {
            console.error('[Session Error] Failed to create new user:', error);
            return res.status(500).json({ error: 'Failed to initialize user session.' });
        }
    }
    next();
};
app.use(loginMiddleware);

// Warum: Bereitstellung der Frontend-Dateien aus dem 'public'-Ordner
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log(`Statische Frontend-Dateien werden von: ${publicPath} bereitgestellt.`);

// Warum: Die Startseite soll die 'index.html' des Frontends laden
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Warum: API-Routen für spezifische Datenoperationen
app.use('/api/nutritionScore', nutritionScoreRoutes);
app.use('/api/scanItem', scanItemRoutes);

// Warum: Server starten und auf eingehende Anfragen warten
httpServer.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});