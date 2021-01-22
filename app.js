const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8000;
const cors = require("cors");


const ROOM_SIZE = 4;
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
          players.push(socket.id);
        //   console.log(rooms);
        }
    }); 

    if (!socket.isassigned) {
        let room = "room" + roomId
        rooms.set(room, {gameStarted: false, players: [socket.id]});
        socket.room = room;
        socket.isassigned = true;
        socket.join(room);
        roomId++;
        // console.log(rooms);
    }

    // console.log(io.sockets.adapter.rooms);
    emitAssignment(socket);

    socket.on("disconnecting", _ => {
        rooms.get(socket.room).players.remove(socket.id);
        if (!rooms.get(socket.room).gameStarted) {
            emitAssignment(socket);
        }
        if (rooms.get(socket.room).players <= 0) {
            rooms.delete(socket.room);
        }
    })
}

function emitAssignment(socket) {
    let roomSize = rooms.get(socket.room).players.length;
    if (roomSize >= ROOM_SIZE) {
        for (let i = 0; i < roomSize; i++) {
            io.to(rooms.get(socket.room).players[i]).emit("assign", roomSize, i + 1);
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