/**
 * 更新phaser版本到3.55.2
 */
const WIDTH = 40;
const HIGHT = 20;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 16 * WIDTH,
    height: 16 * HEIGHT,
    zoom: 1
  },
  // pixelArt: true,
  physics: {
    'default': 'arcade',
    arcade: {
      debug: true
    }
  },
});
  
game.scene.add('boot', Boot, true, params);
game.scene.add('play', Play, false, params);