const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

let rooms = {}; // Structure : { roomId: [socketId1, socketId2] }

io.on('connection', (socket) => {
    console.log(`Nouvelle tentative de connexion : ${socket.id}`);

    // Trouver une room avec une seule personne
    let roomId = Object.keys(rooms).find(id => rooms[id].length === 1);

    if (!roomId) {
        // Aucune place libre, on crée une nouvelle room
        roomId = socket.id;
        rooms[roomId] = [];
    }

    // Rejoindre la room
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.currentRoom = roomId;

    // Déterminer le rôle
    const side = rooms[roomId].length === 1 ? 'left' : 'right';
    socket.emit('role', side);
    console.log(`Joueur ${socket.id} assigné à ${side} dans la room ${roomId}`);

    // Relais des mouvements (uniquement dans la room)
    socket.on('move', (y) => {
        socket.to(socket.currentRoom).emit('opponentMove', y);
    });

    // Relais de la balle (uniquement dans la room)
    socket.on('ballSync', (ballData) => {
        socket.to(socket.currentRoom).emit('ballUpdate', ballData);
    });

    socket.on('disconnect', () => {
        const rId = socket.currentRoom;
        if (rooms[rId]) {
            rooms[rId] = rooms[rId].filter(id => id !== socket.id);
            if (rooms[rId].length === 0) {
                delete rooms[rId];
            } else {
                // Informer l'autre joueur que l'adversaire est parti
                socket.to(rId).emit('error', 'L\'adversaire a quitté la partie.');
            }
        }
        console.log(`Joueur ${socket.id} déconnecté`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur Multi-Lobby sur port ${PORT}`));
