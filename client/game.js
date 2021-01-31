class playScenes extends Phaser.Scene
{
    constructor()
    {
        super();
	}

	preload()
	{
		this.load.image('test-sprite', 'assets/test-sprite.png');
		this.load.image('fireball', 'assets/fireball.png');
		this.load.image('bg', 'assets/background.jpg');
		this.load.image('tiles', 'assets/Itch release raw tileset.png');
		this.load.tilemapTiledJSON('map', 'assets/map/mainMap.json');
	}

    create()
    {
		let self = this;
		this.socket = io();

		this.velocity = 160;

		this.otherPlayers = this.physics.add.group();

		this.fire = [];
		this.time = 30;

		let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
		this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);

		this.physics.world.setBounds(0, 0, 1000, 1000);

		const map = this.make.tilemap({key: 'map'});
		const tileset = map.addTilesetImage('testTileset', 'tiles');
		const platforms = map.createLayer('Platforms', tileset, 0, 0);

		this.cameras.main.zoom = 2;

		/* this.ball = this.add.circle(400, 250, 10, 0xffffff, 1);
		this.physics.add.existing(this.ball);
		this.ball.body.setBounce(1, 1);
		this.ball.body.setMaxSpeed(400);

		this.ball.body.setCollideWorldBounds(true, 1, 1)
		this.ball.body.onWorldBounds = true; */

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
			} else {
				self.socket.on("create npcs", npcInfo => {
					onNPCCreate(self, npcInfo);
				});
				self.socket.on("update npcs", onNPCUpdate);
			}
		});

		this.socket.on('playerMoved', function (playerInfo)
		{
			//console.log(playerInfo);
			self.otherPlayers.getChildren().forEach(function(otherPlayer){
				if(playerInfo.playerID === otherPlayer.playerID)
				{
					otherPlayer.setPosition(playerInfo.x, playerInfo.y);
				}
			});
		});

		this.cursors = this.input.keyboard.createCursorKeys();
	}

	addPlayer(self, playerInfo){
		if(playerInfo.type == 'hider')
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'fireball').setScale(0.25);
			self.playerType = 'hider';
		}
		else
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'fireball').setScale(0.25);
			self.playerType = 'finder';
		}
		self.player.setCollideWorldBounds(true);
		self.player.direction = 'left';
		self.physics.add.existing(self.player, true);
		self.cameras.main.startFollow(self.player);
	}

	addOtherPlayers(self, playerInfo)
	{
		let otherPlayer;
		if(playerInfo.type == 'hider')
		{
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'fireball').setScale(0.25);
		}
		else
		{
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'fireball').setScale(0.25);
		}
		otherPlayer.playerID = playerInfo.playerID;
		otherPlayer.type = playerInfo.type;
		otherPlayer.direction = 'left';
		self.otherPlayers.add(otherPlayer);
		self.physics.add.existing(otherPlayer, true);
	}

    update()
    {
		let self = this;
		if (this.player)
		{
			this.updateMovement();
			this.updateServer();
		}
		this.updateFireBall();
		if (this.playerType == 'hider') {
			updateNPC(this.socket);
		} else {
			if (this.time == 0) {
				this.emitFireBall();
				this.time = 30;
			}
			this.time--;
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
	}

	updateFireBall()
	{
		for (let i=0; i<this.fire.length; i++) {
			let fireballDir = this.fire[i].direction;
			if (fireballDir === 'up') {
				this.fire[i].body.setVelocityY(-this.velocity);
			} else if (fireballDir === 'down') {
				this.fire[i].body.setVelocityY(this.velocity);
			} else if (fireballDir === 'left') {
				this.fire[i].body.setVelocityX(-this.velocity);
			} else {
				this.fire[i].body.setVelocityX(this.velocity);
			}
			if (this.fire[i].body.checkWorldBounds()) {
				console.log(this.fire.length);
				this.fire[i].destroy();
				this.fire.splice(i, 1);
				console.log(this.fire.length);
			}
			this.otherPlayers.getChildren().forEach((otherPlayer) => {
				if (otherPlayer.type == 'hider') {
					this.physics.add.collider(this.fire[i], otherPlayer, ()=> {
						console.log(this.fire);
						this.fire[i].destroy();
						this.fire.splice(i, 1);
						otherPlayer.destroy();
					});
				}
			});
		}
	}

	emitFireBall()
	{
		let spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
			let fireball = this.physics.add.sprite(this.player.x, this.player.y, 'fireball').setScale(0.05);
			fireball.direction = this.player.direction;
			this.fire.push(fireball);
		}
	}

	updateServer()
	{
		let x = this.player.x;
		let y = this.player.y;

		if(this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y))
		{
			this.socket.emit('playerMovement', {x: this.player.x, y: this.player.y});
		}

		this.player.oldPosition = {
			x: this.player.x,
			y: this.player.y
		}
	}
}

export default playScenes;