const NUM_OF_NPC = 50;
const npcs = new Array();


// for client 1
function createNPC(phaser, socket) {
    let npcInfo = new Array();
    for (let i = 0; i < NUM_OF_NPC; i++) {
        let npc = phaser.physics.add.sprite(Math.random() * 1000, Math.random() * 1000, 'hider');
        npc.time = Math.floor(Math.random() * 100);
        npc.move = Math.floor(Math.random() * 7);
        npc.body.setCollideWorldBounds(true);
        npcs.push(npc);
        npcInfo.push({x: npc.x, y: npc.y});
        phaser.physics.add.existing(npc, true);
        phaser.physics.add.collider(npc, phaser.platforms);
    }
    socket.emit("create npcs", npcInfo);
}

function updateNPC(socket) {
    let npcInfo = new Array();
    for (let i = 0; i < npcs.length; i++) {
        let npc = npcs[i];
        if (npc.time <= 0) {
            npc.time = Math.floor(Math.random() * 100);
            npc.move = Math.floor(Math.random() * 7);
        }

        if (npc.move == 1) { // go left
            npc.setVelocityX(-30);
            npc.anims.play('hider-walk', true);
            npc.setFlipX(false);
        } else if (npc.move == 2) { // go up
            npc.setVelocityY(30);
            npc.anims.play('hider-walk', true);
        } else if (npc.move == 3) { // go right
            npc.setVelocityX(30);
            npc.anims.play('hider-walk', true);
            npc.setFlipX(true);
        } else if (npc.move == 4) { // go down
            npc.setVelocityY(-30);
            npc.anims.play('hider-walk', true);
        } else {
            npc.setVelocityX(0);
            npc.setVelocityY(0);
            npc.anims.play('hider-still', true);
        }
        npc.time--;
        npcInfo.push({x: npc.x, y: npc.y, move: npc.move});
    }

    socket.emit("update npcs", npcInfo);
}


// for client 2 & 3;
function onNPCCreate(phaser, npcInfo) {
    for (let i = 0; i < npcInfo.length; i++) {
        let info = npcInfo[i];
        let npc = phaser.physics.add.sprite(info.x, info.y, 'hider');
        npc.body.setCollideWorldBounds(true);
        phaser.physics.add.existing(npc, true);
        phaser.physics.add.collider(npc, phaser.platforms);
        npcs.push(npc);
    }
}

function onNPCUpdate(npcInfo) {
    for (let i = 0; i < npcInfo.length; i++) {
        let info = npcInfo[i];
        let npc = npcs[i];
        npc.x = info.x;
        npc.y = info.y;
        if (info.move > 0 && info.move < 4) {
            npc.anims.play('hider-walk', true);
        } else {
            npc.anims.play('hider-still', true);
        }

        if (info.move == 1) {
            npc.setFlipX(false);
        } else if (info.move == 3) {
            npc.setFlipX(true);
        }
    }
}