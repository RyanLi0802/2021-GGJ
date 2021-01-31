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
		this.load.image('tiles', 'assets/Itch release raw tileset.png');
		this.load.tilemapTiledJSON('map', 'assets/map/mainMap.json');
		this.load.image('mask', 'assets/mask1.png');
		this.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');
		this.load.spritesheet('finder', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 63, endFrame: 64});
		this.load.spritesheet('hider', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 80, endFrame: 81});
	}

    create()
    {
		let self = this;
		this.socket = io();
		this.gameEnd = false;

		this.velocity = 50;

		this.otherPlayers = this.physics.add.group();

		this.fire = [];
		this.gunFired = false;
		this.timer = 1500;

		let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
		this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);

		this.physics.world.setBounds(0, 0, 1000, 1000);

		const map = this.make.tilemap({key: 'map'});
		const tileset = map.addTilesetImage('testTileset', 'tiles');
		const ground = map.createLayer('Ground', tileset, 0, 0).setPipeline('Light2D');
		this.doors = map.createLayer('Doors', tileset, 0, 0).setPipeline('Light2D');
		this.platforms = map.createLayer('Platforms', tileset, 0, 0).setPipeline('Light2D');
		this.platforms.setCollisionByExclusion(-1, true);
		this.doors.setCollisionByExclusion(-1, true);

		this.cameras.main.zoom = 2;

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

			if (self.playerType == 'hider') {
				createNPC(self, self.socket);
				self.socket.on("fireball", fireball => {
					let ball = self.physics.add.sprite(fireball.x, fireball.y, 'fireball').setScale(0.05);
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
				self.socket.on("update npcs", onNPCUpdate);
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
			self.gameEnd = true;
			self.player.setVelocityX(0);
			self.player.setVelocityY(0);
			if (winner == 'finder') {
				this.finderWins();
			} else {
				this.hiderWins();
			}
		})

		this.initializeAnimations(self);

		this.cursors = this.input.keyboard.createCursorKeys();

	// 	this.spotlight = this.make.sprite({
	// 		x: 200,
	// 		y: 200,
	// 		key: 'mask',
	// 		add: true
	// 	});
	// this.spotlight.scale = 2;

	this.light = this.lights.addLight(200, 200, 100).setScrollFactor(1.0);

	this.lights.enable().setAmbientColor(0x000000);

	//bg.mask = new Phaser.Display.Masks.BitmapMask(this, this.spotlight);
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
	}

	addPlayer(self, playerInfo){
		if(playerInfo.type == 'hider')
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'hider');
		}
		else
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'finder');
		}
		self.playerType = playerInfo.type;
		self.player.setCollideWorldBounds(true);
		self.player.direction = 'left';
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
		self.otherPlayers.add(otherPlayer);
		self.physics.add.existing(otherPlayer, true);
		self.physics.add.collider(otherPlayer, self.platforms);
		self.physics.add.collider(otherPlayer, self.doors);
	}

	update()
	{
		if (!this.gameEnd) {
			if (this.player)
			{
				this.updateMovement();
				//this.updateOtherPlayers();
				this.updateServer();
			}
			if (this.playerType == 'hider') {
				updateNPC(this.socket);
			} else {
				this.emitFireBall();
			}
			this.updateFireBall();
		}
	}

	updateMovement()
	{
		if(this.cursors.left.isDown)
		{
			this.player.setVelocityX(-this.velocity);
			this.player.direction = 'left';
		}
		else if (this.cursors.right.isDown)
		{
			this.player.setVelocityX(this.velocity);
			this.player.direction = 'right';
		}
		else
		{
			this.player.setVelocityX(0);
		}

		if(this.cursors.up.isDown)
		{
			this.player.setVelocityY(-this.velocity);
			this.player.direction = 'up';
		}
		else if (this.cursors.down.isDown)
		{
			this.player.setVelocityY(this.velocity);
			this.player.direction = 'down';
		}
		else
		{
			this.player.setVelocityY(0);
		}

		this.light.x = this.player.x;
		this.light.y = this.player.y;
		console.log(this.light.x + " " + this.player.x+" " +this.light.y+" " + this.player.y);

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
			this.player.anims.play(this.playerType + '-walk', true);
		} else
		{
			this.player.anims.play(this.playerType + '-still', true);
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
				if (fireballDir === 'up') {
					this.fire[i].body.setVelocityY(-this.velocity*1.5);
				} else if (fireballDir === 'down') {
					this.fire[i].body.setVelocityY(this.velocity*1.5);
				} else if (fireballDir === 'right') {
					this.fire[i].body.setVelocityX(this.velocity*1.5);
				} else {
					this.fire[i].body.setVelocityX(-this.velocity*1.5);
				}
				if (this.fire[i].body.checkWorldBounds()) {
					this.fire[i].destroy();
					this.fire[i] = null;
				}
				this.fire[i].angle += 1;
			}
		}
	}

	emitFireBall()
	{
		let spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		if (Phaser.Input.Keyboard.JustDown(spaceBar) && !this.gunFired) {
			let fireball = this.physics.add.sprite(this.player.x, this.player.y, 'bullet').setScale(0.5);
			fireball.direction = this.player.direction;
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
							this.finderWins();
							this.socket.emit("game end", "finder");
						});
					}
			});
			this.socket.emit("fireball", {x:fireball.x, y:fireball.y, direction:fireball.direction});
			this.gunFired = true;
			this.time.delayedCall(1500, () => {
				this.gunFired = false;
			})
		}
	}

	finderWins() {
		const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
		const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
		if (this.playerType == "hider") {
			this.player.destroy();
			let bmpText = this.add.bitmapText(this.player.x - 140, this.player.y - 100,
				'carrier_command',"You've Lost :-(", 10);
			this.physics.add.existing(bmpText, true);
			bmpText.setScrollFactor(0);
		} else {
			this.otherPlayers.getChildren().forEach(otherPlayer => {
				if (otherPlayer.type == 'hider') {
					otherPlayer.destroy();
				}
			});
			let bmpText = this.add.bitmapText(this.player.x - 200, this.player.y - 100,
										'carrier_command',"You Win!", 21);
			// let text = this.add.text(this.player.x, this.player.y, "You win!");
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
			bmpText.setScrollFactor(0);

		} else {
			let bmpText = this.add.bitmapText(this.player.x - 140, this.player.y - 100,
				'carrier_command',"You've Lost :-(", 10);
			bmpText.setScrollFactor(0);
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