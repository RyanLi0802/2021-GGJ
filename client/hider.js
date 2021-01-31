function updateHider(player, playerID, vel, cursors, socket)
{
  player.body.setVelocity(0);
    if (cursors.left.isDown) {
        player.body.setVelocityX(-1*vel);
    }
    else if (cursors.right.isDown) {
        player.body.setVelocityX(vel);
    }
    else if (cursors.up.isDown) {
        player.body.setVelocityY(-1*vel);
    }
    else if (cursors.down.isDown) {
        player.body.setVelocityY(vel);
    }
    socket.emit('playerMovement', {id: playerID, y: player.y, x:player.x});
}