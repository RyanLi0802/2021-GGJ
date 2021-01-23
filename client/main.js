(function() {

    const ROOM_SIZE = 3;
    var myId;
    var socket = io();
    socket.on("assign", onAssignment);

    function onAssignment(roomSize, id) {
        if (roomSize >= ROOM_SIZE) {
            myId = id;
            $("msg-board").innerText = `Let's start the game!
            My id is ${myId}`;
            socket.off("assign", onAssignment);
        } else {
            $("msg-board").innerText = `finding players: ${roomSize}/${ROOM_SIZE}`;
        }
    }

    function $(id) {
        return document.getElementById(id);
    }
  })();