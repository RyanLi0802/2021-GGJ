import Game from './game.js';
import Title from './title.js';
(function() {
    var socket = io();
    /* PHASER CODE */
    const config = {
        width: 500,
        height: 400,
        type: Phaser.AUTO,
        pixelArt: true,
        audio: {
            disableWebAudio: true
        },
        debug: true,
        physics: {
            default: 'arcade',
            arcade: {
                fps: 60,
                gravity: {y : 0}
            }
        },
        socket: socket
    };

    const game = new Phaser.Game(config);
    game.scene.add('Game', Game);
    game.scene.add('Title', Title);
    game.scene.start('Title', socket);


    // game.events.off("hidden", game.onHidden, game, false);
    // game.events.off("visible", game.onVisible, game, false);

    /* ROOM MANAGEMENT CODE */

    const ROOM_SIZE = 2;
    var myId;
    socket.on("assign", onAssignment);

    function onAssignment(roomSize, id) {
        if (roomSize >= ROOM_SIZE) {
            myId = id;
            $("msg-board").innerText = `Let's start the game!
            My id is ${myId}`;
            socket.off("assign", onAssignment);
            game.scene.stop("Title");
            game.scene.start('Game', socket);
        } else {
            $("msg-board").innerText = `finding players: ${roomSize}/${ROOM_SIZE}`;
        }
    }

    function $(id) {
        return document.getElementById(id);
    }
  })();