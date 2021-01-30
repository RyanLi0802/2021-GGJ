class playScenes extends Phaser.Scene
{
    constructor()
    {
        super();
	}

	preload()
	{
		this.load.image('test-sprite', 'assets/test-sprite2.png');
	}

    create()
    {
		let self = this;
		this.socket = io();

		this.player = this.physics.add.sprite(400, 250, 'test-sprite');

		/* this.ball = this.add.circle(400, 250, 10, 0xffffff, 1);
		this.physics.add.existing(this.ball);
		this.ball.body.setBounce(1, 1);
		this.ball.body.setMaxSpeed(400);

		this.ball.body.setCollideWorldBounds(true, 1, 1)
		this.ball.body.onWorldBounds = true;

		this.socket.on('currentPlayers', function(info){
			info.players.forEach(function(player){
				if(player.playerID === self.socket.id){
					self.addPlayer(self, player);
				}
				else 
				{
					self.addOtherPlayer(self, player);	
				}
			});

			self.physics.add.collider(self.paddle, self.ball, self.handlePaddleBallCollision, undefined, self);
			self.physics.add.collider(self.otherPaddle, self.ball, self.handlePaddleBallCollision, undefined, self);

			self.physics.world.on('worldbounds', self.handleBallWorldBoundsCollision, self)

			self.time.delayedCall(1500, () => {
				self.resetBall(info.ballPosition.angle)
			})
		});

		this.socket.on('opponentMoved', function(y_pos)
		{
			self.otherPaddle.y = y_pos;
		}); */

		this.cursors = this.input.keyboard.createCursorKeys();
	}

	addPlayer(self, playerInfo){
		if(playerInfo.position == 'left')
		{
			self.paddle = self.add.rectangle(50, 250, 30, 100, 0xffffff, 1);
		}
		else
		{
			self.paddle = self.add.rectangle(750, 250, 30, 100, 0xffffff, 1);
		}
		self.physics.add.existing(self.paddle, true);
	}

	addOtherPlayer(self, playerInfo)
	{
		if(playerInfo.position == 'left')
		{
			self.otherPaddle = self.add.rectangle(50, 250, 30, 100, 0xffffff, 1);
		}
		else
		{
			self.otherPaddle = self.add.rectangle(750, 250, 30, 100, 0xffffff, 1);
		}
		self.physics.add.existing(self.otherPaddle, true);
	}

    handleBallWorldBoundsCollision(body, up, down, left, right)
	{
		if (left || right)
		{
			return
		}
	}

	handlePaddleBallCollision(paddle, ball)
	{
		/** @type {Phaser.Physics.Arcade.Body} */
		const body = this.ball.body
		const vel = body.velocity
		vel.x *= 1.05
		vel.y *= 1.05

		body.setVelocity(vel.x, vel.y)
    }
    
    update()
    {
        if(this.paddle)
		{
			const body = this.paddle.body;
			if (this.cursors.up.isDown)
			{
				if(this.paddle.y > 50)
				{
					this.paddle.y -= 10
					body.updateFromGameObject()
				}
			}
			else if (this.cursors.down.isDown)
			{
				if(this.paddle.y < 450)
				{
					this.paddle.y += 10
					body.updateFromGameObject()
				}
			}

			if(this.paddle.oldPosition && this.paddle.y !== this.paddle.oldPosition.y)
			{
				this.socket.emit('playerMovement', {y: this.paddle.y});
			}
			this.paddle.oldPosition = {
				y: this.paddle.y
			}
		}
    }
    
    resetBall(angle)
	{
		this.ball.setPosition(400, 250)

		const vec = this.physics.velocityFromAngle(angle, 300)

		this.ball.body.setVelocity(vec.x, vec.y)
	}
}

export default playScenes;