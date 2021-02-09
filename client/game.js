class playScenes extends Phaser.Scene
{
  constructor() {
    super();
	}

	preload()
	{
		this.load.image('test-sprite', 'assets/test-sprite.png');
		this.load.image('fireball', 'assets/fireball.png');
		this.load.image('bullet', 'assets/bullet.png');
		this.load.image('bg', 'assets/background.jpg');
		this.load.image('shoe', 'assets/shoe.png');
		this.load.image('ice', 'assets/ice.png');
		this.load.image('tiles', 'assets/Itch release raw tileset.png');
		this.load.tilemapTiledJSON('map', 'assets/map/mainMap.json');
		this.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');
		this.load.spritesheet('finder', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 63, endFrame: 64});
		this.load.spritesheet('hider', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 80, endFrame: 81});
		this.load.spritesheet('hider-display', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 74, endFrame: 75});
		this.load.spritesheet('key', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 71, endFrame: 72});
	}

    create(socket)
    {
		let self = this;
		this.socket = socket;
		this.gameEnd = false;

		this.shoeBuff = false;
		this.iceBuff = false;

		this.velocity = 50;

		this.otherPlayers = this.physics.add.group();

		this.fire = [];
		this.gunFired = false;
		this.timer = 1500;

		let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
		this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);

		this.physics.world.setBounds(560, 140, 800, 800);

		const map = this.make.tilemap({key: 'map'});
		const tileset = map.addTilesetImage('testTileset', 'tiles');
		const ground = map.createLayer('Ground', tileset, 560, 140).setPipeline('Light2D');
		this.doors = map.createLayer('Doors', tileset, 560, 140).setPipeline('Light2D');
		this.platforms = map.createLayer('Platforms', tileset, 560, 140).setPipeline('Light2D');
		this.platforms.setCollisionByExclusion(-1, true);
		this.doors.setCollisionByExclusion(-1, true);

		this.cameras.main.zoom = 2;

		this.socket.emit('scene created', true);

		this.socket.on('currentPlayers', function(info){
			info.players.forEach(function(player){
				if(player.playerID === self.socket.id){
					self.addPlayer(self, player);
				}
				else
				{
					self.addOtherPlayers(self, player);
				}
			});

			popup(self, self.socket);

			if (self.playerType == 'hider') {
				createNPC(self, self.socket);
				createKey(self, self.socket);
				self.socket.on("fireball", fireball => {
					let ball = self.physics.add.sprite(fireball.x, fireball.y, 'bullet').setScale(0.5);
					ball.direction = fireball.direction;
					self.fire.push(ball);
					let i = self.fire.length - 1;
					self.physics.add.collider(ball, self.platforms, _=> {
						ball.destroy();
						self.fire[i] = null;
					});
				});
			} else {
				self.socket.on("create npcs", npcInfo => {
					onNPCCreate(self, npcInfo);
				});
				self.socket.on('create keys', keyInfo => {
					onKeyCreate(self, keyInfo);
				});
				self.socket.on("update npcs", onNPCUpdate);
				self.socket.on("update keys", keyInfo => {
					onKeyUpdate(keyInfo, self);
				});
				self.socket.on("keyTaken", data => {
					onKeyTaken(data);
				})
			}
		});

		this.socket.on('playerMoved', function (playerInfo)
		{
			self.otherPlayers.getChildren().forEach(function(otherPlayer){
				if(playerInfo.playerID === otherPlayer.playerID)
				{
					otherPlayer.setPosition(playerInfo.x, playerInfo.y);
					if(otherPlayer.type == "hider")
					{
						if (playerInfo.velocity.x > 0) {
							otherPlayer.setFlipX(true);
						} else if(playerInfo.velocity.x < 0) {
							// otherwise, make them face the other side
							otherPlayer.setFlipX(false);
						}
					}
					else
					{
						if (playerInfo.velocity.x > 0) {
							otherPlayer.setFlipX(false);
						} else if(playerInfo.velocity.x < 0){
							// otherwise, make them face the other side
							otherPlayer.setFlipX(true);
						}
					}
					if(playerInfo.velocity.x != 0 || playerInfo.velocity.y != 0)
					{
						otherPlayer.anims.play(otherPlayer.type + '-walk', true);
					}
					else
					{
						otherPlayer.anims.play(otherPlayer.type + '-still', true);
					}
				}
			});
		});

		this.socket.on('game end', winner => {
			let velX = self.player.body.velocity.x;
			let velY = self.player.body.velocity.y;
			self.player.setVelocityX(0);
			self.player.setVelocityY(0);
			if (!self.gameEnd) {
				self.gameEnd = true;
				if (winner == 'finder') {
					this.finderWins(velX, velY);
				} else {
					this.hiderWins(velX, velY);
				}
			}
		});

		this.initializeAnimations(self);

		this.cursors = this.input.keyboard.createCursorKeys();
	}

	initializeAnimations(self)
	{
		self.anims.create({
			key:'hider-walk',
			frames: self.anims.generateFrameNumbers('hider', { start: 80, end: 81 }),
			frameRate: 10,
			repeat: -1
		})

		self.anims.create({
			key: 'hider-still',
			frames: [ { key: 'hider', frame: 80 } ],
			frameRate: 20
		});
		self.anims.create({
			key:'finder-walk',
			frames: self.anims.generateFrameNumbers('finder', { start: 63, end: 64 }),
			frameRate: 10,
			repeat: -1
		})

		self.anims.create({
			key: 'finder-still',
			frames: [ { key: 'finder', frame: 63 } ],
			frameRate: 20
		});

		self.anims.create({
			key: 'hider-display-walk',
			frames: self.anims.generateFrameNumbers('finder', { start: 74, end: 75 }),
			frameRate: 10,
			repeat: -1
		})

		self.anims.create({
			key: 'hider-display-still',
			frames: [ { key: 'hider-display', frame: 74 } ],
			frameRate: 20
		})

		self.anims.create({
			key: 'key-still',
			frames: [ { key: 'key', frame: 71}],
			frameRate: 20
		})
	}

	addPlayer(self, playerInfo){
		if(playerInfo.type == 'hider')
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'hider-display');
			self.light = self.lights.addLight(250, 250, 0).setScrollFactor(1.0);
			self.lights.enable().setAmbientColor(0xffffff);
		}
		else
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'finder');
			self.light = self.lights.addLight(250, 250, 100).setScrollFactor(1.0);
			self.lights.enable().setAmbientColor(0x000000);
		}
		self.playerType = playerInfo.type;
		self.player.setCollideWorldBounds(true);
		self.player.key = 0;
		self.player.direction = {x: 'left', y: 'none'};
		self.physics.add.existing(self.player, true);
		self.cameras.main.startFollow(self.player);
		self.physics.add.collider(self.player, self.platforms);
		self.physics.add.collider(self.player, self.doors);
	}

	addOtherPlayers(self, playerInfo)
	{
		let otherPlayer;
		if(playerInfo.type == 'hider')
		{
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'hider').setPipeline('Light2D');
		}
		else
		{
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'finder').setPipeline('Light2D');
		}
		otherPlayer.playerID = playerInfo.playerID;
		otherPlayer.type = playerInfo.type;
		otherPlayer.direction = 'left';
		otherPlayer.key = 0;
		self.otherPlayers.add(otherPlayer);
		self.physics.add.existing(otherPlayer, true);
		self.physics.add.collider(otherPlayer, self.platforms);
		self.physics.add.collider(otherPlayer, self.doors);
	}

	update()
	{
		if (!this.gameEnd) {
			if (this.player && !frozen)
			{
				this.updateMovement();
				//this.updateOtherPlayers();
				this.updateServer();

			}
			if (this.playerType == 'hider') {
				updateNPC(this.socket);
				updateKey(this, this.socket);
				// console.log(this.player.key);
				if (this.player.key >= 3) {
					this.doors.setCollisionByExclusion(-1, false);
					this.doors.visible = false;
				}
				// console.log(this.player.x);
				if(this.player.x <= 565 || this.player.x >= 1350)
				{
					this.socket.emit('game end','hider');
				}
			} else {
				this.emitFireBall();
				drawKeys();
			}

			if (this.shoeBuff) {
				let keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
				if (Phaser.Input.Keyboard.JustDown(keyD)) {
					applyShoeBuff(this);
					this.shoeBuff = false;
				}
			}

			if (this.iceBuff) {
				let keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
				if (Phaser.Input.Keyboard.JustDown(keyS)) {
					applyIceBuff(this);
					this.iceBuff = false;
				}
			}

			this.updateFireBall();
		}
	}

	updateMovement()
	{
		if(this.cursors.left.isDown)
		{
			this.player.setVelocityX(-this.velocity);
			this.player.direction.x = 'left';
		}
		else if (this.cursors.right.isDown)
		{
			this.player.setVelocityX(this.velocity);
			this.player.direction.x = 'right';
		}
		else
		{
			this.player.setVelocityX(0);
			if(this.player.direction.y == 'none')
			{
				if(this.player.flipX)
				{
					this.player.direction.x = 'left';
				}
				else
				{
					this.player.direction.x = 'right';
				}
			}
			else
			{
				this.player.direction.x = 'none';
			}
		}

		if(this.cursors.up.isDown)
		{
			this.player.setVelocityY(-this.velocity);
			this.player.direction.y = 'up';
		}
		else if (this.cursors.down.isDown)
		{
			this.player.setVelocityY(this.velocity);
			this.player.direction.y = 'down';
		}
		else
		{
			this.player.setVelocityY(0);
			this.player.direction.y = 'none';
		}
		if(this.light)
		{
			this.light.x = this.player.x;
			this.light.y = this.player.y;
		}
		if(this.playerType == "hider")
		{
			if (this.player.body.velocity.x > 0) {
				this.player.setFlipX(true);
			} else if (this.player.body.velocity.x < 0) {
				// otherwise, make them face the other side
				this.player.setFlipX(false);
			}
		}
		else
		{
			if (this.player.body.velocity.x > 0) {
				this.player.setFlipX(false);
			} else if (this.player.body.velocity.x < 0) {
				// otherwise, make them face the other side
				this.player.setFlipX(true);
			}
		}

		const velocity = this.player.body.velocity;

		if(velocity.x != 0 || velocity.y != 0)
		{
			if(this.playerType == 'hider')
			{
				this.player.anims.play(this.playerType + '-display-walk', true);
			}
			else
			{
				this.player.anims.play(this.playerType + '-walk', true);
			}
		} else
		{
			if(this.playerType == 'hider')
			{
				this.player.anims.play(this.playerType + '-display-still', true);
			}
			else
			{
				this.player.anims.play(this.playerType + '-still', true);
			}
		}
	}

	updateOtherPlayers(){
		this.otherPlayers.getChildren().forEach(function(otherPlayer){
			otherPlayer.anims.play(otherPlayer.type + '-still', true);
		});
	}

	updateFireBall() {
		for (let i=0; i<this.fire.length; i++) {
			if (this.fire[i] != null) {
				let fireballDir = this.fire[i].direction;
				if (fireballDir.y === 'up') {
					this.fire[i].body.setVelocityY(-75);
				} else if (fireballDir.y === 'down') {
					this.fire[i].body.setVelocityY(75);
				}
				if (fireballDir.x === 'right') {
					this.fire[i].body.setVelocityX(75);
				} else if(fireballDir.x === 'left'){
					this.fire[i].body.setVelocityX(-75);
				} else if(fireballDir.y === 'none')
				{
					this.fire[i].body.setVelocityX(75);
				}
				if (this.fire[i].body.checkWorldBounds()) {
					this.fire[i].destroy();
					this.fire[i] = null;
				}
				if (this.fire[i] != null) {
					this.fire[i].angle += 1;
				}
			}
		}
	}

	emitFireBall()
	{
		let spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		if (Phaser.Input.Keyboard.JustDown(spaceBar) && !this.gunFired && !frozen) {
			let fireball = this.physics.add.sprite(this.player.x, this.player.y, 'bullet').setScale(0.5);
			fireball.direction = {x: this.player.direction.x, y: this.player.direction.y};
			this.fire.push(fireball);
			let i = this.fire.length - 1;
			this.physics.add.collider(fireball, this.platforms, _=> {
				fireball.destroy();
				this.fire[i] = null;
			});
			this.otherPlayers.getChildren().forEach((otherPlayer) => {
				if (otherPlayer.type == 'hider') {
						this.physics.add.collider(fireball, otherPlayer, ()=> {
							fireball.destroy();
							this.fire[i] = null;
							otherPlayer.destroy();
							// this.finderWins(this.player.velocity.x, this.player.velocity.y);
							// this.gameEnd = true;
							this.socket.emit("game end", "finder");
						});
					}
			});
			this.socket.emit("fireball", {x:fireball.x, y:fireball.y, direction:fireball.direction});
			this.gunFired = true;
			this.time.delayedCall(1000, () => {
				this.gunFired = false;
			})
		}
	}

	finderWins(velX, velY) {
		if (this.playerType == "hider") {
			let bmpText = this.add.bitmapText(this.player.x - 140 - velX, this.player.y - 100,
				'carrier_command',"You've Lost :-(", 10);
			let text = this.add.text(this.player.x - 70, this.player.y - 40, "You've Lost :-(");
			bmpText.setScrollFactor(0);
			this.player.destroy();
		} else {
			this.otherPlayers.getChildren().forEach(otherPlayer => {
				if (otherPlayer.type == 'hider') {
					otherPlayer.destroy();
				}
			});
			let bmpText = this.add.bitmapText(this.player.x, this.player.y,
										'carrier_command',"You Win!", 21);
			let text = this.add.text(this.player.x - 40, this.player.y - 40, "You win!");
			// this.physics.add.existing(bmpText, true);
			// this.add.existing(bmpText, true);
			// this.physics.add.existing(text, true);
			// this.add.existing(text, true);
			bmpText.setScrollFactor(0);
			console.log(bmpText);
		}
	}

	hiderWins() {
		if (this.playerType == 'hider') {
			let bmpText = this.add.bitmapText(this.player.x - 200, this.player.y - 100,
				'carrier_command',"You Win!", 21);
			let text = this.add.text(this.player.x - 40, this.player.y - 40, "You win!");
			bmpText.setScrollFactor(0);

		} else {
			let bmpText = this.add.bitmapText(this.player.x - 140, this.player.y - 100,
				'carrier_command',"You've Lost :-(", 10);
			bmpText.setScrollFactor(0);
			let text = this.add.text(this.player.x - 60, this.player.y - 40, "You've Lost :-(");
		}
	}


	updateServer()
	{
		let x = this.player.x;
		let y = this.player.y;

		if(this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y))
		{
			this.socket.emit('playerMovement', {x: this.player.x, y: this.player.y, velocity: this.player.body.velocity});
		}

		this.player.oldPosition = {
			x: this.player.x,
			y: this.player.y
		}
	}
}

export default playScenes;