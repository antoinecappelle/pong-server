const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {}; 

io.on('connection', (socket) => {
    console.log(`[DEBUG] Nouveau socket connecté : ${socket.id}`);

    let roomId = Object.keys(rooms).find(id => rooms[id].length === 1);
    if (!roomId) {
        roomId = socket.id;
        rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;

    const side = rooms[roomId].length === 1 ? 'left' : 'right';
    socket.emit('role', side);
    console.log(`[DEBUG] Socket ${socket.id} assigné au rôle : ${side}`);

    if (rooms[roomId].length === 2) {
        console.log(`[DEBUG] Room ${roomId} complète. Envoi du signal START.`);
        io.to(roomId).emit('playerJoined');
    }

    // Test de réception de mouvement
    socket.on('move', (y) => {
        socket.to(socket.roomId).emit('opponentMove', y);
    });

    // Test de réception de balle
    socket.on('ballSync', (data) => {
        // Log toutes les 100 réceptions pour ne pas inonder la console Render
        if (Math.random() < 0.01) console.log(`[DEBUG] Relais ballSync de ${socket.id} vers la room`);
        socket.to(socket.roomId).emit('ballUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log(`[DEBUG] Déconnexion de ${socket.id}`);
        if (rooms[socket.roomId]) {
            rooms[socket.roomId] = rooms[socket.roomId].filter(id => id !== socket.id);
            if (rooms[socket.roomId].length === 0) delete rooms[socket.roomId];
            else io.to(socket.roomId).emit('error', 'Adversaire parti');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[SYSTEM] Serveur Debug actif sur port ${PORT}`));
