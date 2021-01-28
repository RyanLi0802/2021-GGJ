import Game from './game.js';

(function() {

    /* PHASER CODE */
    const config = {
        width: 800,
        height: 500,
        type: Phaser.AUTO,
        audio: {
            disableWebAudio: true
        },
        physics: {
            default: 'arcade',
            arcade: {
                fps: 60,
                gravity: {y : 0},
            }
        },
    };
      
    const game = new Phaser.Game(config);
    game.scene.add('Game', Game);

    game.events.off("hidden", game.onHidden, game, false);
    game.events.off("visible", game.onVisible, game, false);

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

  window.addEventListener("message", function(event)
	{
		
		if(event.data == "tick"){
			for(var i in window.timeouts){
				if(new Date().getTime() - window.timeouts[i].started >= window.timeouts[i].delay && window.timeouts[i]){
					window.timeouts[i].func();
					delete window.timeouts[i];
				}
			}
			for(var i in window.intervals){
				var currTime = new Date().getTime();
				if(currTime - window.intervals[i].last >= window.intervals[i].delay && window.intervals[i]){
					window.intervals[i].last = currTime;
					window.intervals[i].func();
				}
			}
			window.postMessage('tick', '*');
			
		}
	}, false);
	(function(context) {
	  'use strict';
		context.timeouts = [];
		context.intervals = [];
		var lastTime = new Date().getTime();
		var old = {};
		old.setTimeout = context.setTimeout;
		old.setInterval = context.setInterval;
		old.clearTimeout = context.clearTimeout;
		old.clearInterval = context.clearInterval;
		if(typeof(context.postMessage) == 'function'){
			context.setTimeout = function(fn, millis) {
				var timeout = {func: fn, delay: millis,started: new Date().getTime()};
				var l = timeouts.length;
				timeouts[l] = timeout;
				return l;
			};
			context.clearTimeout = function(cancel) {
				for(var i in timeouts){
					if(timeouts[i] == cancel)
						timeouts.splice(cancel,1);
				}
			};
			context.setInterval = function(fn, delay ) {
				var interval = {func: fn, delay: delay,last: new Date().getTime()};
				var l = intervals.length;
				intervals[l] = interval;
				return interval;
			};
			context.clearInterval = function(cancel) {
				for(var i in intervals){
					if(intervals[i] == cancel)
						timeouts.splice(cancel,1);
				}
			};
		}
		context.requestAnimationFrame = function( callback, element ) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
			var id = context.setTimeout( function() {
				callback( currTime + timeToCall );
			}, timeToCall );
			lastTime = currTime + timeToCall;
			return id;
		};
		context.cancelAnimationFrame = function( id ) {
			context.clearTimeout( id );
		};
		context.addEventListener("load",function(){

			if(typeof(context.postMessage) == 'function'){
				context.postMessage('tick', '*');
			}else{
				context.setTimeout = old.setTimeout
				context.setInterval = old.setInterval
				context.clearTimeout = old.clearTimeout
				context.clearInterval = old.clearInterval
				alert("Your browser does not support postMessage. Sorry but you will be forced to default to the standard setInterval and setTimeout functions. This means you may experience pauses in your game when you navigate away from the tab it is playing in.");
			}
		});
	})(this);