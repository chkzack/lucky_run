const params = {
  baseMapWidth: 40,
  mapWidth: 3 * 40,
  mapHeight: 20,
  distance: 0,
  gravity: 800,
  jump: -400,
  pace: 4
};

/**
 * 游戏主场景
 */
class Demo extends Phaser.Scene {
  constructor() {
    super({ key: "demo", active: true });
  }

  preload() {
    this.debugGraphics = this.add.graphics();
    this.data = this.scene.settings.data;
    this.load.image("tiles", "assets/tilemaps/test_16.png");

    // roles
    this.load.spritesheet("role", "assets/fish1.png", { frameWidth: 29, frameHeight: 24 , startFrame: 0, endFrame: 2}); //鱼
  }

  create() {
    // distance text
    this.text = this.add.text(16, 16, this.data, {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      fill: "#ffffff",
      backgroundColor: "#000000",
    }).setScrollFactor(0).setDepth(100);

    this.role = this.physics.add
                    .sprite(2*16, 2*16, "role")
                    .setDepth(100)
                    .setGravityY(this.data.gravity)
                    .setCollideWorldBounds(true)
                    .setBounce(0);

    // 生成角色通用动画
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('role', { frames: [ 0, 1, 2 ] }),
      frameRate: 8,
      repeat: -1
    });
    this.role.play('run');

    // Creating a blank tilemap with the specified dimensions
    this.map = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width: this.data.mapWidth,
      height: this.data.mapHeight,
    });
    let tiles = this.map.addTilesetImage("tiles");

    // layer.setScale(2);
    this.layer = this.map.createBlankLayer("base", tiles)
    this.map.setCollision([ 3, 5, 7, 11, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 ]);

    // Add a simple scene with some random element
    // background
    this.layer.fill(-1, 0, 0, this.data.mapWidth, this.data.mapHeight);

    // block
    this.layer.fill(25, 0, 18, this.data.mapWidth, 2); // Surface of the water
    // this.layer.fill(77, 0, 19, this.data.mapWidth, 1); // Body of the water
    // this.groundLayer.randomize(0, 0, this.data.mapWidth / 2, 13, 0); // Wall above the water

    this.input.once('pointerdown', this.startGame, this);

    // 与地面碰撞
    this.physics.add.collider(this.role, this.layer, this.hitCheck, null, this);

    this.enableDebug();

    this.initLevel();
  }

  update(time, delta) {
    // 
    if (!this.isGameStart()) return ; 
    // Any speed as long as 16 evenly divides by it

    // 初始化
    this.sx = this.sx || 0;
    this.times = this.times || 0;

    this.sx += this.data.pace;
    this.data.distance += this.data.pace;
    this.text.setText("Distance: " + this.data.distance + "px");

    this.role.x += this.data.pace;

    // 16像素
    if (this.sx == 16) {
      //  Reset and create new strip
      let tile, prev;

      // 数组地图域更新处理
      for (let y = 0; y < this.data.mapHeight; y++) {
        for (let x = 1; x < this.data.mapWidth; x++) {
          tile = this.layer.getTileAt(x, y);
          
          this.layer.putTileAt(tile, x-1, y); 
          
          if (x === this.data.mapWidth - 1) {
            this.layer.putTileAt(-1, x, y);
          }
        }
      }

      this.times++;
      this.sx = 0;
      this.role.x = 2*16;
    }

    if (this.times == this.data.baseMapWidth) {
      // 预渲染两个主屏的数据
      // 达到具体距离更新下一个地图
      // 长地图处理
      this.pickNextLevel();
      this.times = 0;
    }

    // 恢复镜头
    this.cameras.main.scrollX = this.sx;
  }

  refreshMap(value, index, array) {
    // this.map.putTileAt(value, value.x - 1, value.y, true, value.layer);
    // this.map.removeTileAt(value, value.x, value.y, true, true, value.layer);
  }

  jump() {
    if (this.jumpTimes === undefined) {
      this.jumpTimes = 2;
    }

    if (this.jumpTimes > 0) {
      --this.jumpTimes;
      this.role.setVelocityY(this.data.jump);
      //上升时头朝上
      this.tweens.add({
        targets: this.role,
        angle: -30,
        duration: 100
      });

      // this.soundFly.play();
    }
  }

  hitCheck(role, hitArea) {
    console.info(hitArea);

    if (hitArea.index == 25) {
      this.jumpTimes = 2;
    }

    switch(hitArea.facing) {
      case Phaser.Physics.Arcade.FACING_UP:
        console.info('up');
        break;
      case Phaser.Physics.Arcade.FACING_DOWN:
        console.info('down');
        break;
      case Phaser.Physics.Arcade.FACING_LEFT:
        console.info('left');
        break;
      case Phaser.Physics.Arcade.FACING_RIGHT:
        console.info('right');
        break;
    }
    
  }

  startGame() {
    this.gameState = 'running';
    this.input.on('pointerdown', this.jump, this);
  }

  isGameStart() {
    return this.gameState == 'running';
  }

  stopGame() {
    this.gameState = 'stop';
    this.input.off('pointerdown', this.jump, this);
  }

  initLevel() {

    console.info('init');

    this.layoutLevelConfig('coin', 20, 3);
    this.layoutLevelConfig('coin', 22, 3);
    this.layoutLevelConfig('coin', 24, 4);
    this.layoutLevelConfig('coin', 26, 5);

    this.layoutLevelConfig('coin', 27, 5);
    this.layoutLevelConfig('coin', 28, 4);
    this.layoutLevelConfig('coin', 29, 3);
    this.layoutLevelConfig('coin', 30, 2);

    this.layoutLevelConfig('coin', 32, 5);
    this.layoutLevelConfig('coin', 34, 5);
    this.layoutLevelConfig('coin', 35, 5);
    this.layoutLevelConfig('coin', 36, 5);

    // this.layoutLevelConfig('tube', 12, 5, 16);
    // this.layoutLevelConfig('tube', 12, 5, 16);

  }
  /**
   * 
   * 
   */
  pickNextLevel() {
    // 抽取下一个地图进行渲染
    console.info('gen');
      // pick next level
    this.levels = this.levels || 0;

    if (this.levels % 2 == 0) {
      this.layoutLevelConfig('tube', 12, 5, 16);
      this.layoutLevelConfig('tube', 12, 4, 16);
      this.layoutLevelConfig('tube', 12, 3, 16);
    } else {

      this.layoutLevelConfig('block', 5, 3);
      this.layoutLevelConfig('block', 6, 3);
      this.layoutLevelConfig('block', 5, 4);
      this.layoutLevelConfig('block', 6, 4);

      this.layoutLevelConfig('block2', 21, 3);
      this.layoutLevelConfig('block2', 22, 3);
      this.layoutLevelConfig('block2', 21, 4);
      this.layoutLevelConfig('block2', 22, 4);
      this.layoutLevelConfig('block2', 21, 5);
      this.layoutLevelConfig('block2', 22, 5);
      this.layoutLevelConfig('block2', 21, 6);
      this.layoutLevelConfig('block2', 22, 6);
      this.layoutLevelConfig('block2', 21, 7);
      this.layoutLevelConfig('block2', 22, 7);
      this.layoutLevelConfig('block2', 21, 8);
      this.layoutLevelConfig('block2', 22, 8);
      this.layoutLevelConfig('block2', 21, 9);
      this.layoutLevelConfig('block2', 22, 9);
      this.layoutLevelConfig('block2', 21, 10);
      this.layoutLevelConfig('block2', 22, 10);

      this.layoutLevelConfig('block3', 35, 3);

      this.layoutLevelConfig('bucket', 35, 5);
      this.layoutLevelConfig('bucket', 35, 5);
    }

    this.layer.fill(25, 0, 18, this.data.mapWidth, 2);
    ++this.levels;
  }

  layoutLevelConfig(objectToPlace, tileX, tileY, length) {
    // // Rounds down to nearest tile
    // let pointerTileX = this.map.worldToTileX(worldPoint.x);
    // let pointerTileY = this.map.worldToTileY(worldPoint.y);

    // // Snap to tile coordinates, but in world space
    // this.marker.x = this.map.tileToWorldX(pointerTileX);
    // this.marker.y = this.map.tileToWorldY(pointerTileY);

    tileX += this.data.baseMapWidth;
    tileY = 20 - tileY;

    switch (objectToPlace) {
      case "flower":
        this.layer.putTileAt(15, tileX, tileY, true);
        break;
      case "bucket":
        this.layer.putTileAt(1, tileX, tileY, true);
        break;
      case "block":
        this.layer.putTileAt(25, tileX, tileY, true);
        break;
      case "block2":
        this.layer.putTileAt(26, tileX, tileY, true);
        break;
      case "block3":
        // You can place a row of tile indexes at a location
        this.layer.putTilesAt([ 
                                [35, 35], 
                                [35, 37]
                              ], tileX, tileY, true);
        break; 
      case "tube":
        // You can place a row of tile indexes at a location
        let tube = [15];
        if (length == undefined) {
          tube.push(16, 17);
        } else {
          for (let i=0; i< length-2; i++) {
            tube.push(16);
          } 
          tube.push(17);
        }
        this.map.putTilesAt(tube, tileX, tileY, true, this.layer);
        break;
      case "tiki":
        // You can also place a 2D array of tiles at a location
        this.map.putTilesAt(
          [
            [49, 50],
            [51, 52],
          ],
          pointerTileX,
          pointerTileY,
          true,
          this.blocksLayer
        );
        break;
      default:
        break;
    }
  }

  enableDebug() {
    this.showTiles = false;
    this.showCollidingTiles = false; 
    this.showFaces = false;

    this.input.keyboard.on('keydown-ONE', function (event) {
      this.showTiles = !this.showTiles;
      this.drawDebug();
    }, this);

    this.input.keyboard.on('keydown-TWO', function (event) {
      this.showCollidingTiles = !this.showCollidingTiles;
      this.drawDebug();
    }, this);

    this.input.keyboard.on('keydown-THREE', function (event) {
      this.showFaces = !this.showFaces;
      this.drawDebug();
    }, this); 
  }

  drawDebug () {
    var tileColor = this.showTiles ? new Phaser.Display.Color(105, 210, 231, 200) : null;
    var colldingTileColor = this.showCollidingTiles ? new Phaser.Display.Color(243, 134, 48, 200) : null;
    var faceColor = this.showFaces ? new Phaser.Display.Color(40, 39, 37, 255) : null;

    this.debugGraphics.clear();

    // Pass in null for any of the style options to disable drawing that component
    this.map.renderDebug(this.debugGraphics, {
        tileColor: tileColor,                   // Non-colliding tiles
        collidingTileColor: colldingTileColor,  // Colliding tiles
        faceColor: faceColor                    // Interesting faces, i.e. colliding edges
    });

    // helpText.setText(getHelpMessage());
  }
}

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
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
});

game.scene.add("demo", Demo, false, params);
