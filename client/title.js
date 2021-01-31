class TitleScene extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');
    }

    create(socket) {
        // const self = this;
        // const ROOM_SIZE = 2;
        // const BASE_STRING = " Finding  \n\nplayers...\n\n";
        this.socket = socket;
        this.bmpText = this.add.bitmapText(130, 100, 
            'carrier_command'," Finding  \n\nplayers...", 24);
        // this.socket.on("assign", function(roomSize) {
        //     self.bmpText.setText(BASE_STRING + roomSize + "/" + ROOM_SIZE);
        // })
    }   
}

export default TitleScene;