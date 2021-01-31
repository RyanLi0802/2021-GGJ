const NUM_OF_KEY = 4;
const keys = [];


// for client 1
function createKey(phaser, socket) {
    let keyInfo = [];
    for (let i = 0; i < NUM_OF_KEY; i++) {
        let xLoc = Math.random() * 500 + 250;
        let yLoc = Math.random() * 500 + 250;
        let key = phaser.physics.add.sprite(xLoc, yLoc, 'test-sprite').setScale(0.025);
        phasor.game.physics.arcade.overlap(sprite1, sprite2, this.someFunction, null, this);
        phaser.physics.add.collider(key, phaser.platforms);
        keys.push(key);
        keyInfo.push({x: key.x, y: key.y});
        phaser.physics.add.existing(key, true);
    }
    socket.emit("create keys", keyInfo);
}

function updateKey(phaser, socket) {
    let keyInfo = [];
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];

      if(key != null && phaser.cursors.space.isDown)
      {
        let dis = (key.x - phaser.player.x) * (key.x - phaser.player.x) + (key.y - phaser.player.y) * (key.y - phaser.player.y);
        if (dis < 625) {
          phaser.player.key++;
          key.destroy();
          keys[i] = null;
        }
      }
      if(key != null) {
        keyInfo.push({x: key.x, y: key.y});
      }
    }
    socket.emit("update keys", keyInfo);
}


// for client 2 & 3;
function onKeyCreate(phaser, keyInfo) {
    for (let i = 0; i < keyInfo.length; i++) {
        let info = keyInfo[i];
        let key = phaser.physics.add.sprite(info.x, info.y, 'test-sprite').setScale(0.025);
        phaser.physics.add.existing(key, true);
        keys.push(key);
    }
}

function onKeyUpdate(keyInfo) {
    for (let i = 0; i < keyInfo.length; i++) {
        let info = keyInfo[i];
        let key = keys[i];
        if (key != null) {
          key.x = info.x;
          key.y = info.y;
        }
    }
}