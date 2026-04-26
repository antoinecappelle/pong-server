const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {}; 

io.on('connection', (socket) => {
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

    // Si on est deux, on lance le match
    if (rooms[roomId].length === 2) {
        io.to(roomId).emit('playerJoined');
    }

    socket.on('move', (y) => {
        socket.to(socket.roomId).emit('opponentMove', y);
    });

    socket.on('ballSync', (data) => {
        socket.to(socket.roomId).emit('ballUpdate', data);
    });

    socket.on('disconnect', () => {
        if (rooms[socket.roomId]) {
            rooms[socket.roomId] = rooms[socket.roomId].filter(id => id !== socket.id);
            if (rooms[socket.roomId].length === 0) delete rooms[socket.roomId];
            else io.to(socket.roomId).emit('error', 'Adversaire parti');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur prêt`));
