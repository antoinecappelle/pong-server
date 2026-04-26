const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Autorise toutes les sources
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Connecté:', socket.id);

    // Attribution des rôles
    if (Object.keys(players).length === 0) {
        players[socket.id] = { side: 'left' };
        socket.emit('role', 'left');
    } else if (Object.keys(players).length === 1) {
        players[socket.id] = { side: 'right' };
        socket.emit('role', 'right');
    } else {
        socket.emit('error', 'Partie pleine');
    }

    // Relais des mouvements de raquette
    socket.on('move', (y) => {
        socket.broadcast.emit('opponentMove', y);
    });

    // Relais de la position de la balle (calculée par le joueur de gauche)
    socket.on('ballSync', (ballData) => {
        socket.broadcast.emit('ballUpdate', ballData);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
