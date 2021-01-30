import Game from './game.js';

(function() {

    /* PHASER CODE */
    const config = {
        width: 1000,
        height: 1000,
        type: Phaser.AUTO,
        audio: {
            disableWebAudio: true
        },
        physics: {
            default: 'arcade',
            arcade: {
                fps: 60,
                gravity: {y : 0}
            }
        },
    };
      
    const game = new Phaser.Game(config);
    game.scene.add('Game', Game);


    // game.events.off("hidden", game.onHidden, game, false);
    // game.events.off("visible", game.onVisible, game, false);

    /* ROOM MANAGEMENT CODE */

    const ROOM_SIZE = 2;
    var myId;
    var socket = io();
    socket.on("assign", onAssignment);

    function onAssignment(roomSize, id) {
        if (roomSize >= ROOM_SIZE) {
            myId = id;
            $("msg-board").innerText = `Let's start the game!
            My id is ${myId}`;
            socket.off("assign", onAssignment);
            game.scene.start('Game');
        } else {
            $("msg-board").innerText = `finding players: ${roomSize}/${ROOM_SIZE}`;
        }
    }

    function $(id) {
        return document.getElementById(id);
    }
  })();