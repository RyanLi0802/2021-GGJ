const NUM_OF_KEY = 10;
let keys = [];

const origin = {x: 540, y: 160};

const positions = [{x: origin.x + 13 * 8, y: origin.y + 10 * 8},
{x: origin.x + 33 * 8, y: origin.y + 5 * 8},
{x: origin.x + 53 * 8, y: origin.y + 5 * 8},
{x: origin.x + 73 * 8, y: origin.y + 5 * 8},
{x: origin.x + 93 * 8, y: origin.y + 5 * 8},
{x: origin.x + 15 * 8, y: origin.y + 32 * 8},
{x: origin.x + 32 * 8, y: origin.y + 25 * 8},
{x: origin.x + 64 * 8, y: origin.y + 17 * 8},
{x: origin.x + 13 * 8, y: origin.y + 48 * 8},
{x: origin.x + 24 * 8, y: origin.y + 57 * 8},
{x: origin.x + 48 * 8, y: origin.y + 63 * 8},
{x: origin.x + 40 * 8, y: origin.y + 52 * 8},
{x: origin.x + 79 * 8, y: origin.y + 68 * 8},
{x: origin.x + 85 * 8, y: origin.y + 40 * 8},
{x: origin.x + 92 * 8, y: origin.y + 92 * 8}];


// for client 1
function createKey(phaser, socket) {
    let keyInfo = [];
    let keyChosen = new Set();
    for (let i = 0; i < NUM_OF_KEY + 1; i++) {
        let index = Math.floor(Math.random() * positions.length);
        while (keyChosen.has(index)) {
          index = Math.floor(Math.random() * positions.length);
        }
        keyChosen.add(index);
        let xLoc = positions[index].x;
        let yLoc = positions[index].y;
        let key = null;
        if (i == NUM_OF_KEY) {
          key = phaser.physics.add.sprite(xLoc, yLoc, 'test-sprite').setScale(0.0001);
        } else {
          key = phaser.physics.add.sprite(xLoc, yLoc, 'key');
        }
        // phaser.physics.overlap(key, phaser.platforms, function() {
        //   key.destroy();
        //   key = regenerateKey(phaser);
        // }, null, this);
        phaser.physics.add.collider(key, phaser.platforms);
        keys.push(key);
        keyInfo.push({x: key.x, y: key.y});
        phaser.physics.add.existing(key, true);
    }
    socket.emit("create keys", keyInfo);
}

function regenerateKey(phaser) {
  let xLoc = Math.random() * 600 + 660;
  let yLoc = Math.random() * 600 + 240;
  let key = phaser.physics.add.sprite(xLoc, yLoc, 'test-sprite').setScale(0.025).setPipeline('Light2D');
  phaser.physics.overlap(key, phaser.platforms, function() {
    key.destroy();
    key = regenerateKey(phaser);
  }, null, this);
  return key;
}

function updateKey(phaser, socket) {
    let keyInfo = [];
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if(key != null && i != keys.length - 1 && phaser.cursors.space.isDown)
      {
        let dis = (key.x - phaser.player.x) * (key.x - phaser.player.x) + (key.y - phaser.player.y) * (key.y - phaser.player.y);
        if (dis < 625) {
          phaser.player.key++;
          key.destroy();
          keys[i] = null;
        }
      }
      if(key != null && key.anims != null) {
        key.anims.play('key-still', true);
        keyInfo.push({x: key.x, y: key.y});
      }
    }
    socket.emit("update keys", keyInfo);
}


// for client 2 & 3;
function onKeyCreate(phaser, keyInfo) {
    for (let i = 0; i < keyInfo.length - 1; i++) {
        let info = keyInfo[i];
        let key=null;
        if (i != keyInfo.length -1)
        key = phaser.physics.add.sprite(info.x, info.y, 'key').setPipeline('Light2D');
        else {
          key = phaser.physics.add.sprite(info.x, info.y, 'key');
        }
        phaser.physics.add.existing(key, true);
        keys.push(key);
    }
    let key = phaser.physics.add.sprite(keyInfo[keyInfo.length - 1].x, keyInfo[keyInfo.length - 1].y, 'key').setScale(0.0001);
    phaser.physics.add.existing(key, true);
        keys.push(key);
}

function onKeyUpdate(keyInfo) {
    for (let i = 0; i < keyInfo.length - 1; i++) {
        let info = keyInfo[i];
        let key = keys[i];
        if (key != null && key.anims != null) {
          key.x = info.x;
          key.y = info.y;
          key.anims.play('key-still', true);
        }
    }
}