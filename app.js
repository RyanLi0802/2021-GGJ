const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;
const cors = require("cors");


const ROOM_SIZE = 2;
const rooms = new Map();
let roomId = 1;

app.use(express.static(__dirname + '/client'));
app.use(cors());

function onConnection(socket){
    // console.log("connected");
    socket.isassigned = false;

    rooms.forEach((roomInfo, room) => {
        let players = roomInfo.players;
        if (!socket.isassigned && players.length < ROOM_SIZE
            && !roomInfo.gameStarted) {
          socket.isassigned = true;
          socket.room = room;
          socket.join(room);
          players.push({playerID: socket.id, x: 960, y: 640, type: 'finder'});
          //console.log(rooms);
        }
    });

    if (!socket.isassigned) {
        let room = "room" + roomId;
        let angle = Math.floor(Math.random() * 360);     // returns a random integer from 0 to 360
        rooms.set(room,
            {
                gameStarted: false,
                ballPosition:
                {
                    angle: angle
                },
                players: [{playerID: socket.id, x: 960, y: 300, type: 'hider'}]
            }
        );
        socket.room = room;
        socket.isassigned = true;
        socket.join(room);
        roomId++;
        //console.log(rooms);
    }

    // console.log(io.sockets.adapter.rooms);
    console.log(1);
    emitAssignment(socket);

    socket.on("disconnecting", _ => {
        console.log(2);
        console.log(rooms.get(socket.room).players);
        let players = rooms.get(socket.room).players
        // rooms.get(socket.room).players.remove(socket.id);
        for (let i = 0; i < players.length; i++) {
            if (socket.id == players[i].playerID) {
                players.splice(i--, 1);
            }
        }
        console.log(rooms.get(socket.room).players);
        if (!rooms.get(socket.room).gameStarted) {
            emitAssignment(socket);
        }
        if (rooms.get(socket.room).players <= 0) {
            rooms.delete(socket.room);
        }
    });

    socket.on('playerMovement', function(movementData)
    {
        rooms.get(socket.room).players.forEach(function(player)
        {
            if(player.playerID === socket.id)
            {
                player.x = movementData.x;
                player.y = movementData.y;
            }
            else
            {
                io.to(player.playerID).emit("playerMoved", {playerID: socket.id, x: movementData.x, y: movementData.y, velocity: movementData.velocity});
            }
        });
    });

    socket.on('create npcs', data => {
        setTimeout(_=> {
            io.in(socket.room).emit('create npcs', data);
        }, 3000);
        // console.log(data);
    });

    socket.on('create npcs', data => {
        setTimeout(_=> {
            io.in(socket.room).emit('create keys', data);
        }, 3000);
        // console.log(data);
    });

    socket.on('update npcs', data => {
        io.in(socket.room).emit('update npcs', data);
    });

    socket.on('fireball', data => {
        io.in(socket.room).emit('fireball', data);
    });

    socket.on('game end', data => {
        console.log("game end");
        console.log(data);
        io.in(socket.room).emit('game end', data);
    });

    socket.on('create keys', data => {
        io.in(socket.room).emit('create keys', data);
    });

    socket.on('update keys', data => {
        io.in(socket.room).emit('update keys', data);
    });

    socket.on('scene created', _=>{
        //Sends information
        io.to(socket.id).emit('currentPlayers', rooms.get(socket.room));
    });
}

function emitAssignment(socket) {
    console.log(rooms.get(socket.room).players);
    let roomSize = rooms.get(socket.room).players.length;
    if (roomSize >= ROOM_SIZE) {
        for (let i = 0; i < roomSize; i++) {
            let id = rooms.get(socket.room).players[i].playerID;
            io.to(id).emit("assign", roomSize, i+1);

            // io.to(id).emit("currentPlayers", rooms.get(socket.room));
        }
        rooms.get(socket.room).gameStarted = true;
    }
    io.in(socket.room).emit("assign", roomSize);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));