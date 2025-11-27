"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
// Socket.IO initialisieren, um Echtzeit-Kommunikation zu ermöglichen
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket first.');
    }
    return io;
};
exports.getSocketIO = getSocketIO;
