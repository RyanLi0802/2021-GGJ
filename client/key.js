const NUM_OF_KEY = 6;
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
        phaser.physics.add.collider(key, phaser.platforms);
        keys.push(key);
        keyInfo.push({x: key.x, y: key.y});
        phaser.physics.add.existing(key, true);
    }
    socket.emit("create keys", keyInfo);
}

function updateKey(phaser, socket) {
    let keyInfo = [];
    let keyChanged = false;
    for (let i = 0; i < NUM_OF_KEY; i++) {
      let key = keys[i];
      if(key != null && phaser.cursors.space.isDown) {
        let dis = (key.x - phaser.player.x) * (key.x - phaser.player.x) + (key.y - phaser.player.y) * (key.y - phaser.player.y);
        if (dis < 625) {
          phaser.player.key++;
          key.destroy();
          keys[i] = null;
          phaser.player.setVelocityY(0);
          phaser.player.setVelocityX(0);
          keyChanged = true;
        }
      }
      if(key != null && key.anims != null) {
        key.anims.play('key-still', true);
        keyInfo.push({x: key.x, y: key.y});
      }
    }


    if (keyChanged) {
      socket.emit("update keys", keyInfo);
      let remain = 3 - phaser.player.key;
      if (remain <= 0 ) {
        alert("A key has been found. No more keys needed! RUN AND ESCAPE!");
      } else {
        alert("A key has been found. Need " + remain + " more keys to escape.");
      }
      socket.emit("keyTouched", phaser.player.key);
    }
}


// for client 2 & 3;
function onKeyCreate(phaser, keyInfo) {
    for (let i = 0; i < keyInfo.length - 1; i++) {
        let info = keyInfo[i];
        let key=null;
        key = phaser.physics.add.sprite(info.x, info.y, 'key').setPipeline('Light2D');
        phaser.physics.add.existing(key, true);
        keys.push(key);
    }
    let key = phaser.physics.add.sprite(keyInfo[keyInfo.length - 1].x, keyInfo[keyInfo.length - 1].y, 'test-sprite').setScale(0.0001);
    phaser.physics.add.existing(key, true);
    key.anims.play('key-still', true);
    keys.push(key);
}

function drawKeys() {
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    if (key != null && key.anims != null) {
      key.anims.play('key-still', true);
    }
  }
}

function onKeyUpdate(keyInfo, phaser) {
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] != null) {
        keys[i].destroy();
      }
      keys[i] = null;
    }

    for (let i = 0; i < keyInfo.length; i++) {
        let info = keyInfo[i];
        let key = phaser.physics.add.sprite(info.x, info.y, 'key').setPipeline('Light2D');    
        key.x = info.x;
        key.y = info.y;
        phaser.physics.add.existing(key, true);
        key.anims.play('key-still', true);
        keys[i] = key;
    }

    keys[keys.length - 1] = phaser.physics.add.sprite(100, 100, 'test-sprite').setScale(0.0001);
    phaser.physics.add.existing(key, true);
    // keys[keys.length - 1].anims.play('key-still', true);
}

function onKeyTaken(data){
  let remain = 3 - data;
  if (remain <= 0) {
    alert("A Key has been found. The GGJ is going to escape! Stop him!");
  } else {
    alert("A Key has been found. The GGJ needs " + remain + " more keys left.");
  }
}