"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const client_1 = require("@prisma/client");
// import { PrismaSessionStore } from '@prisma/session-store'; // przestarzala forma, dlatego trzeba uzyc ponizszej
// import { PrismaSessionStore } from 'connect-prisma';
const prisma_session_store_1 = require("@quixo3/prisma-session-store");
const http_1 = require("http");
const socket_1 = require("./socket");
const nutritionScore_route_1 = __importDefault(require("./routes/nutritionScore.route"));
const scanItem_route_1 = __importDefault(require("./routes/scanItem.route"));
const app = (0, express_1.default)();
const port = 8000;
const prisma = new client_1.PrismaClient();
// Warum: Socket.IO und Express sollen denselben Port nutzen
const httpServer = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(httpServer);
// Warum: Zum Parsen von JSON- und URL-kodierten Daten im Request-Body
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Warum: Für persistente Benutzersitzungen mit Prisma als Session Store
app.use((0, express_session_1.default)({
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    },
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: new prisma_session_store_1.PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        logger: undefined,
    }),
}));
// Warum: Sicherstellen, dass jeder Client eine userId in seiner Session hat
const loginMiddleware = async (req, res, next) => {
    if (!req.session.userId) {
        try {
            const newUser = await prisma.user.create({ data: {} });
            req.session.userId = newUser.id;
            console.log(`[Session] New user created with ID: ${newUser.id} and assigned to session.`);
        }
        catch (error) {
            console.error('[Session Error] Failed to create new user:', error);
            return res.status(500).json({ error: 'Failed to initialize user session.' });
        }
    }
    next();
};
app.use(loginMiddleware);
// Warum: Bereitstellung der Frontend-Dateien aus dem 'public'-Ordner
const publicPath = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicPath));
console.log(`Statische Frontend-Dateien werden von: ${publicPath} bereitgestellt.`);
// Warum: Die Startseite soll die 'index.html' des Frontends laden
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
// Warum: API-Routen für spezifische Datenoperationen
app.use('/api/nutritionScore', nutritionScore_route_1.default);
app.use('/api/scanItem', scanItem_route_1.default);
// Warum: Server starten und auf eingehende Anfragen warten
httpServer.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
