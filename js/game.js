/**
 * 更新phaser版本到3.55.2
 */
 const game = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: "#000000",
  parent: "game",
  scale: {
    // mode: Phaser.Scale.FIT,
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
    width: (16 + 8) * params.baseMapWidth,
    height: 16 * params.mapHeight,
    zoom: 1,
  },
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  }
});
  
game.scene.add('boot', Boot, true, params);
game.scene.add('play', Play, false, params);