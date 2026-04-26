const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {}; 

io.on('connection', (socket) => {
    // 1. On cherche une room avec EXACTEMENT 1 personne
    let roomId = Object.keys(rooms).find(id => rooms[id].length === 1);
    
    if (!roomId) {
        roomId = "Room_" + socket.id; // ID unique pour la room
        rooms[roomId] = [];
        console.log(`[SERVEUR] Création d'une nouvelle pièce : ${roomId}`);
    }

    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;

    const side = rooms[roomId].length === 1 ? 'left' : 'right';
    socket.emit('role', side);
    console.log(`[SERVEUR] J1(${socket.id}) -> ${side} dans ${roomId}`);

    // 2. On prévient tout le monde dans la room quand on est 2
    if (rooms[roomId].length === 2) {
        console.log(`[SERVEUR] Match prêt dans ${roomId} !`);
        io.to(roomId).emit('playerJoined');
    }

    // 3. Relais critique : Mouvement
    socket.on('move', (y) => {
        socket.to(socket.roomId).emit('opponentMove', y);
    });

    // 4. Relais critique : Balle et Score
    socket.on('ballSync', (data) => {
        // Le serveur re-transmet l'objet data exact à l'autre joueur
        socket.to(socket.roomId).emit('ballUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log(`[SERVEUR] Départ de ${socket.id}`);
        if (rooms[socket.roomId]) {
            // On prévient l'autre joueur AVANT de supprimer la room
            socket.to(socket.roomId).emit('opponentLeft', 'L\'adversaire a quitté la partie.');
            
            rooms[socket.roomId] = rooms[socket.roomId].filter(id => id !== socket.id);
            if (rooms[socket.roomId].length === 0) {
                delete rooms[socket.roomId];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[SYSTEM] Serveur démarré sur port ${PORT}`));
