const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Un joueur s\'est connecté : ' + socket.id);
    
    // Assigne le joueur 1 ou 2
    if (Object.keys(players).length < 2) {
        players[socket.id] = { x: 0, y: 160, id: socket.id };
    }

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].y = data.y;
            socket.broadcast.emit('update', { id: socket.id, y: data.y });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});
