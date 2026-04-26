const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log(`NOUVELLE CONNEXION : ${socket.id}`);

    // On envoie un message de test toutes les 2 secondes à ce socket précis
    const timer = setInterval(() => {
        socket.emit('server_debug', 'Le serveur te voit !');
    }, 2000);

    // On envoie le rôle immédiatement
    socket.emit('role', 'left'); 

    socket.on('disconnect', () => {
        clearInterval(timer);
        console.log("Joueur parti");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Debug Server Live"));
