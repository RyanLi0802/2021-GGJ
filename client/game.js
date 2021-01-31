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
		this.load.spritesheet('finder', 'assets/tilesetMPR.png', {frameWidth: 8, frameHeight: 8, startFrame: 63, endFrame: 64});
	}

    create()
    {
		let self = this;
		this.socket = io();

		this.velocity = 50;

		this.otherPlayers = this.physics.add.group();

		let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
		this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);

		this.physics.world.setBounds(0, 0, 1000, 1000);

		const map = this.make.tilemap({key: 'map'});
		const tileset = map.addTilesetImage('testTileset', 'tiles');
		const ground = map.createLayer('Ground', tileset, 0, 0);
		const platforms = map.createLayer('Platforms', tileset, 0, 0);
		platforms.setCollisionByExclusion(-1, true);

		this.cameras.main.zoom = 3;
		this.cameras.main.roundPixels = true;

		this.socket.on('currentPlayers', function(info){
			info.players.forEach(function(player){
				if(player.playerID === self.socket.id){
					self.addPlayer(self, player, platforms);
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
			console.log(playerInfo);
			self.otherPlayers.getChildren().forEach(function(otherPlayer){
				if(playerInfo.playerID === otherPlayer.playerID)
				{
					otherPlayer.setPosition(playerInfo.x, playerInfo.y);
				}
			});
		});

		this.cursors = this.input.keyboard.createCursorKeys();
	}

	addPlayer(self, playerInfo, platforms){
		if(playerInfo.type == 'hider')
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'fireball').setScale(0.25);
			self.playerType = 'hider';
		}
		else
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'finder');
			self.playerType = 'finder';

			self.anims.create({
				key:'walk',
				frames: this.anims.generateFrameNumbers('finder', { start: 63, end: 64 }),
				frameRate: 10,
				repeat: -1
			})

			this.anims.create({
				key: 'still',
				frames: [ { key: 'finder', frame: 63 } ],
				frameRate: 20
			});
		}
		self.player.setCollideWorldBounds(true);
		self.physics.add.existing(self.player, true);
		self.cameras.main.startFollow(self.player);
		self.physics.add.collider(self.player, platforms);
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
		self.otherPlayers.add(otherPlayer);
		self.physics.add.existing(otherPlayer, true);
	}
    
    update()
    {
		let self = this;
		if(this.player)
		{
			this.updateMovement();
			this.updateServer();
		}

		if (this.playerType == 'hider') {
			updateNPC(this.socket);
		}
	}
	
	updateMovement()
	{
		if(this.cursors.left.isDown)
		{	
			this.player.setVelocityX(-this.velocity);
		}
		else if (this.cursors.right.isDown)
		{
			this.player.setVelocityX(this.velocity);
		}
		else
		{
			this.player.setVelocityX(0);
		}

		if(this.cursors.up.isDown)
		{
			this.player.setVelocityY(-this.velocity);
		}
		else if (this.cursors.down.isDown)
		{
			this.player.setVelocityY(this.velocity);
		}
		else
		{
			this.player.setVelocityY(0);
		}

		if (this.player.body.velocity.x > 0) {
			this.player.setFlipX(false);
		} else if (this.player.body.velocity.x < 0) {
			// otherwise, make them face the other side
			this.player.setFlipX(true);
		}

		const velocity = this.player.body.velocity;
		if(velocity.x != 0 || velocity.y != 0)
		{
			this.player.anims.play('walk', true);
		}
		else
		{
			this.player.anims.play('still', true);
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