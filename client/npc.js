const NUM_OF_NPC = 50;
const npcs = new Array();


// for client 1
function createNPC(phaser, socket) {
    let npcInfo = new Array();
    for (let i = 0; i < NUM_OF_NPC; i++) {
        let npc = phaser.physics.add.sprite(Math.random() * 1000, Math.random() * 1000, 'test-sprite').setScale(0.025);
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
        } else if (npc.move == 2) { // go up
			npc.setVelocityY(30);
        } else if (npc.move == 3) { // go right
            npc.setVelocityX(30);
        } else if (npc.move == 4) { // go down
			npc.setVelocityY(-30);
        } else {
            npc.setVelocityX(0);
            npc.setVelocityY(0);
        }
        npc.time--;
        npcInfo.push({x: npc.x, y: npc.y});
    }

    socket.emit("update npcs", npcInfo);
}


// for client 2 & 3;
function onNPCCreate(phaser, npcInfo) {
    for (let i = 0; i < npcInfo.length; i++) {
        let info = npcInfo[i];
        let npc = phaser.physics.add.sprite(info.x, info.y, 'test-sprite').setScale(0.025);
        npc.body.setCollideWorldBounds(true);
        phaser.physics.add.existing(npc, true);
        phaser.physics.add.collider(npc, phaser.platforms);
        npcs.push(npc);
    }
}

function onNPCUpdate(npcInfo) {
    // console.log("received");
    for (let i = 0; i < npcInfo.length; i++) {
        let info = npcInfo[i];
        let npc = npcs[i];
        npc.x = info.x;
        npc.y = info.y;
    }
}