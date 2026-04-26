const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    // Attribution du rôle selon le nombre de connectés
    const count = Object.keys(players).length;
    const side = count === 0 ? 'left' : 'right';
    
    players[socket.id] = { side: side };

    // ON ENVOIE LE RÔLE IMMÉDIATEMENT
    socket.emit('role', side);
    console.log(`Rôle ${side} envoyé à ${socket.id}`);

    socket.on('move', (y) => {
        socket.broadcast.emit('opponentMove', y);
    });

    socket.on('ballSync', (ballData) => {
        socket.broadcast.emit('ballUpdate', ballData);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log(`Déconnexion : ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
