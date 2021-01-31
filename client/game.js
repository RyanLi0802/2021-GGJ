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

		//this.fireball = this.physics.add.sprite(400, 250, 'fireball');

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
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'test-sprite').setScale(0.025);
			self.playerType = 'hider';
		}
		else
		{
			self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'test-sprite').setScale(0.025);
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
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'test-sprite').setScale(0.025);
		}
		else
		{
			otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'test-sprite').setScale(0.025);
		}
		otherPlayer.playerID = playerInfo.playerID;
		self.otherPlayers.add(otherPlayer);
		console.log(self.otherPlayers.children);
		let temp = self.otherPlayers.getChildren();
		console.log(temp[0]);
		for (let i=0;i<temp.length;i++) {
			console.log(temp[i]);
		}
	}

    update()
    {
		let self = this;
		if (this.player)
		{
			this.updateMovement();
			if (this.playerType != 'hider') {
				this.emitFireBall();
			}
			this.updateServer();
		}
		if (this.fire) {
			this.fire.body.setVelocityX(-this.velocity);
			if (this.fire.body.collideWorldBounds) {
				this.fire.destroy();
			}
			let temp = this.otherPlayers.getChildren();
			let hidder = (temp[0]);
			console.log(1);
			this.physics.add.collider(this.fire, temp[0], ()=> {
				console.log(this.fire);
				this.fire.destroy();
				this.fire = null;
				hidder.destroy();
			});
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

	emitFireBall() {
		let spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
			this.fire = this.physics.add.sprite(this.player.x, this.player.y, 'fireball').setScale(0.05);
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