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
	}

    create()
    {
		let self = this;
		this.socket = io();

		this.velocity = 160;

		this.otherPlayers = this.physics.add.group();

		// this.fireball = this.physics.add.sprite(400, 250, 'fireball');
		
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
		self.physics.add.existing(self.player, true);
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