const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io avec CORS autorisé
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let rooms = {}; // Stockage des salons { roomId: [joueurs] }

io.on('connection', (socket) => {
    console.log(`Connexion détectée : ${socket.id}`);

    // Trouver une room qui n'a qu'un seul joueur
    let roomId = Object.keys(rooms).find(id => rooms[id].length === 1);

    if (!roomId) {
        // Si aucune room n'est libre, on en crée une avec l'ID de ce socket
        roomId = socket.id;
        rooms[roomId] = [];
    }

    // Rejoindre la room
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.currentRoom = roomId;

    // Assigner le rôle (le 1er est 'left', le 2ème est 'right')
    const side = rooms[roomId].length === 1 ? 'left' : 'right';
    socket.emit('role', side);
    console.log(`Joueur ${socket.id} est ${side} dans la room ${roomId}`);

    // Relais du mouvement de la raquette
    socket.on('move', (y) => {
        socket.to(socket.currentRoom).emit('opponentMove', y);
    });

    // Relais de la position de la balle (calculée par le joueur gauche)
    socket.on('ballSync', (ballData) => {
        socket.to(socket.currentRoom).emit('ballUpdate', ballData);
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        const rId = socket.currentRoom;
        if (rooms[rId]) {
            rooms[rId] = rooms[rId].filter(id => id !== socket.id);
            if (rooms[rId].length === 0) {
                delete rooms[rId];
            } else {
                // On prévient l'autre joueur que son adversaire est parti
                socket.to(rId).emit('error', 'Adversaire déconnecté.');
            }
        }
        console.log(`Déconnexion : ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur Pong opérationnel sur le port ${PORT}`);
});
