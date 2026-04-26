const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {}; 

io.on('connection', (socket) => {
    console.log(`Connexion : ${socket.id}`);

    // Trouver une room avec 1 place libre
    let roomId = Object.keys(rooms).find(id => rooms[id].length === 1);
    if (!roomId) {
        roomId = socket.id;
        rooms[roomId] = [];
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.currentRoom = roomId;

    // Assigner le rôle
    const side = rooms[roomId].length === 1 ? 'left' : 'right';
    socket.emit('role', side);

    // Relais des mouvements des raquettes
    socket.on('move', (y) => {
        socket.to(socket.currentRoom).emit('opponentMove', y);
    });

    // Relais de la balle et des scores (calculés par le joueur GAUCHE)
    socket.on('ballSync', (data) => {
        socket.to(socket.currentRoom).emit('ballUpdate', data);
    });

    socket.on('disconnect', () => {
        if (rooms[socket.currentRoom]) {
            rooms[socket.currentRoom] = rooms[socket.currentRoom].filter(id => id !== socket.id);
            if (rooms[socket.currentRoom].length === 0) delete rooms[socket.currentRoom];
        }
        console.log(`Déconnexion : ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur Pong Multi-Lobby prêt`));
