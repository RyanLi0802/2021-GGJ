let frozen = false;

function popup(phaser, socket) {
    if (phaser.playerType == "hider") {
        generateItems(phaser, socket);
        setTimeout(function() {
            generateShoe(phaser, socket, 980, 320);
            generateCube(phaser, socket, 870, 280);
        }, 3000);
        setInterval(function() {
            generateItems(phaser, socket);
        }, 60000);
    } else {
        socket.on('pop up', data => {
            if (data.type == 'shoe') {
                generateShoe(phaser, socket, data.x, data.y);
            } else {
                generateCube(phaser, socket, data.x, data.y);
            }
        });
    }
    
    socket.on('consumed', itemInfo => {
        for (let i = 0; i < items.length; i++) {
            if (items[i] != null) {
                items[i].destroy();
                items[i] = null;
            }
        }

        items = [];

        for (let i = 0; i < itemInfo.length; i++) {
            if (itemInfo[i] == null) {
                items.push(null);
            } else if (itemInfo[i].type == "shoe") {
                generateShoe(phaser, socket, itemInfo[i].x, itemInfo[i].y);
            } else {
                generateCube(phaser, socket, itemInfo[i].x, itemInfo[i].y);
            }
        }
    });

    socket.on('freeze', _ => {
        phaser.player.velocity = 0;
        phaser.player.setVelocityX(0);
        phaser.player.setVelocityY(0);
        frozen = true;
        phaser.player.tint = 0x4DD8F4;
        setTimeout(function() {
            phaser.velocity = 50;
            phaser.player.clearTint();
            frozen = false;
        }, 2000);
    });
}


let items = [];

function generateItems(phaser, socket) {
    for (let i = 0; i < 3; i++) {
        let x = Math.random() * 600 + 660;
        let y = Math.random() * 600 + 240;
        let item = Math.floor(Math.random() * 2);
        if (item == 0 ) {       // runing shoes
            generateShoe(phaser, socket, x, y);
        } else {
            generateCube(phaser, socket, x, y);
        }
    }
}


function generateShoe(phaser, socket, x, y) {
    
    let shoe = phaser.physics.add.sprite(x, y, 'shoe').setScale(0.50);
    shoe.type = "shoe";
    items.push(shoe);
    let i = items.length - 1;
    phaser.physics.add.collider(shoe, phaser.player, function() {
        phaser.shoeBuff = true;
        shoe.destroy();
        items[i] = null;
        emitConsumed(socket);
    });
    phaser.physics.add.existing(shoe, true);

    if (phaser.playerType == 'hider') {
        socket.emit('pop up', {x: shoe.x, y: shoe.y, type: "shoe"});
    }
}

function applyShoeBuff(phaser) {
    phaser.velocity = 150;
    setTimeout(function() {
        phaser.velocity = 50;
    }, 2000);
}


function applyIceBuff(phaser) {
    phaser.socket.emit('freeze', phaser.playerType);
    phaser.otherPlayers.getChildren().forEach(otherPlayer => {
        if (otherPlayer.type != phaser.playerType) {
            otherPlayer.tint = 0x4DD8F4;
            setTimeout(function() {
                otherPlayer.clearTint();
            }, 2000);
        }
    })
}


function generateCube(phaser, socket, x, y) {
    let cube = phaser.physics.add.sprite(x, y, 'ice').setScale(0.05);
    cube.type = "cube";
    items.push(cube);
    let i = items.length - 1;
    phaser.physics.add.collider(cube, phaser.player, function() {
        phaser.iceBuff = true;
        cube.destroy();
        items[i] = null;
        emitConsumed(socket);
    });
    phaser.physics.add.existing(cube, true);
    
    if (phaser.playerType == 'hider') {
        socket.emit('pop up', {x: cube.x, y: cube.y, type: "cube"});
    }
}

function emitConsumed(socket) {
    let itemInfo = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i] == null) {
            itemInfo.push(null);
        } else {
            itemInfo.push({x: items[i].x, y: items[i].y, type: items[i].type});
        }
    }

    socket.emit('consumed', itemInfo);
}