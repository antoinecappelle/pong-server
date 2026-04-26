const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    console.log(`Connecté : ${socket.id}`);

    // Attribution simple
    const count = Object.keys(players).length;
    const side = count === 0 ? 'left' : 'right';
    
    players[socket.id] = { side: side };
    
    // ON ENVOIE LE ROLE TOUT DE SUITE
    socket.emit('role', side);
    console.log(`Envoi du rôle ${side} à ${socket.id}`);

    socket.on('move', (y) => {
        socket.broadcast.emit('opponentMove', y);
    });

    socket.on('ballSync', (ballData) => {
        socket.broadcast.emit('ballUpdate', ballData);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log(`Déconnecté : ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur de test lancé`));
