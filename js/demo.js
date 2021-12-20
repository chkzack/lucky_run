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
    this.load.image("tiles", "assets/base.png");

    // roles
    this.load.spritesheet("role", "assets/animations/role.png", { frameWidth: 32, frameHeight: 32 , startFrame: 0, endFrame: 3});
    // 

    this.hour = new Date().getHours;
    if (Math.random() > 0.5) {
    // if (hour >= 6 &&  hour >= 18) {
      this.load.image("background", "assets/background.png");
    } else {
      this.load.image("background", "assets/background2.png");
    }

    this.data.parser.init();
    
  }

  create() {
    this.background = this.add.tileSprite(0, 0, 960, 524, 'background')
                              .setOrigin(0, 0)
                              .setScale(1, 0.6)
                              .setDepth(0)
                              .setAlpha(0.55)
                              .setScrollFactor(0);

    // distance text
    this.text = this.add.text(16, 16, this.data, {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      fill: "#ffffff",
      backgroundColor: "#000000",
    }).setScrollFactor(0).setDepth(100);

    this.timeline = this.add.text(16, 16, this.data, {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      fill: "#ffffff",
      backgroundColor: "#000000",
    }).setScrollFactor(0).setDepth(100);

    // this.setupPhysicsBody();

    this.role = this.physics.add.sprite(2*16, 2*16, "role")
                    .setDepth(100)
                    .setScale(1)
                    .setGravityY(this.data.gravity)
                    .setCollideWorldBounds(true)
                    .setBounce(0);
                    //.setVelocityY(this.data.gravity)
                    // .setExistingBody(this.compoundBody);

    // 生成角色通用动画
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('role', { frames: [ 0, 1, 2, 3 ] }),
      frameRate: 8,
      repeat: -1
    });
    //this.role.play('run');

    // 创建透明图层
    this.map = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width: this.data.mapWidth,
      height: this.data.mapHeight,
    });
    this.tileset = this.map.addTilesetImage("tiles");
    // 补充tileset设置
    this.tileset.TileProperties = this.data.parser.tileProperties;

    // layer.setScale(2);
    this.layer = this.map.createBlankLayer("base", this.tileset)
    this.coinLayer = this.map.createBlankLayer("coin", this.tileset);
    this.coinLayer.setTileIndexCallback(26, this.hitCoin, this);
    
    // Set colliding tiles before converting the layer to Matter bodies!
    //this.layer.setCollisionByProperty({ collides: true });
    this.layer.setCollisionBetween(0, 77);

    // Add a simple scene with some random element
    // background
    this.layer.fill(-1, 0, 0, this.data.mapWidth, this.data.mapHeight);

    // block
    this.layer.fill(4, 0, 18, this.data.mapWidth, 2);

    
    this.input.once('pointerdown', this.startGame, this);

    // 与地面碰撞
    this.physics.add.collider(this.role, this.layer, this.hitCheck, null, this);

    this.enableDebug();

    this.configCollision();

    // 初始化引导关卡
    this.initLevel();
  }

  update(time, delta) {
    this.drawDebug();
    // 
    if (!this.isGameStart()) return ; 
    // Any speed as long as 16 evenly divides by it

    if (this.role.angle < 0) this.role.angle += 2.5; //下降时头朝下

    this.text.setText("Distance: " + this.data.distance + "px, level:" + (this.levels || 0) + ", cost: " + (this.interval || 0) + "ms");

    this.refreshMap();
  }

  setupPhysicsBody() {
  //   let Bodies = Phaser.Physics.Matter.Matter.Bodies;

  //   let rect = Bodies.rectangle(0, 0, 32, 32);
  //   let rectLeft = Bodies.rectangle(-20, 0, 2, 24, { isSensor: true, label: 'left' });
  //   let rectRight = Bodies.rectangle(20, 0, 2, 24, { isSensor: true, label: 'right' });
  //   let rectTop = Bodies.rectangle(0, -20, 24, 2, { isSensor: true, label: 'top' });
  //   let rectBottom = Bodies.rectangle(0, 20, 24, 2, { isSensor: true, label: 'bottom' });

  //   this.compoundBody = Phaser.Physics.Matter.Matter.Body.create({
  //       parts: [ rect, rectLeft, rectRight, rectTop, rectBottom ],
  //       inertia: Infinity
  //   });
  }

  matterPhysicConfig() {
    // Convert the layer. Any colliding tiles will be given a Matter body. If a tile has collision
    // shapes from Tiled, these will be loaded. If not, a default rectangle body will be used. The
    // body will be accessible via tile.physics.matterBody.
    this.matter.world.convertTilemapLayer(this.layer);
    this.matter.world.convertTilemapLayer(this.coinLayer);

    // Change the label of the Matter body on the tiles that should kill the bouncing balls. This
    // makes it easier to check Matter collisions.
    // this.layer.forEachTile(function (tile) {
    //   // In Tiled, the platform tiles have been given a "type" property which is a string
    //   if (tile.properties.type === 'block' || tile.properties.type === 'coin') {
    //       tile.physics.matterBody.body.label = 'block';
    //   }
    // });

    // Loop over all the collision pairs that start colliding on each step of the Matter engine.
    this.matter.world.on('collisionstart', function (event) {
      for (let i = 0; i < event.pairs.length; i++) {
        // The tile bodies in this example are a mixture of compound bodies and simple rectangle
        // bodies. The "label" property was set on the parent body, so we will first make sure
        // that we have the top level body instead of a part of a larger compound body.
        let bodyA = event.pairs[i].bodyA;
        let bodyB = event.pairs[i].bodyB;

        // if ((bodyA.label === 'role' && bodyB.label === 'dangerousTile') ||
        //     (bodyB.label === 'role' && bodyA.label === 'dangerousTile')) {
        // let blockBody = bodyA.label === 'role' ? bodyB : bodyA;
        // let block = blockBody.gameObject;

        if (event.pairs[i].isSensor) {
            var blockBody;
            var playerBody;

            if (bodyA.isSensor) {
                blockBody = bodyB;
                playerBody = bodyA;
            } else if (bodyB.isSensor) {
                blockBody = bodyA;
                playerBody = bodyB;
            }

            //  You can get to the Sprite via `gameObject` property
            let playerSprite = playerBody.gameObject;
            let blockSprite = blockBody.gameObject;

            let color;

            if (playerBody.label === 'left') {
                console.log('left');
            } else if (playerBody.label === 'right') {
              console.log('right');
              this.stopGame();
            } else if (playerBody.label === 'top') {
              console.log('top');
            } else if (playerBody.label === 'bottom') {
              console.log('bottom');
              if (blockBody.gameObject.tile.index == 4) {
                this.jumpTimes = 2;
              }
            }

            // blockSprite.setTintFill(color);
          }
        }
              // A body may collide with multiple other bodies in a step, so we'll use a flag to
              // only tween & destroy the ball once.
              // if (ball.isBeingDestroyed) {
              //     continue;
              // }
              // ball.isBeingDestroyed = true;

              // this.matter.world.remove(ballBody);

              // 结束动画
              // this.tweens.add({
              //     targets: ball,
              //     alpha: { value: 0, duration: 150, ease: 'Power1' },
              //     onComplete: function (ball) { ball.destroy(); }.bind(this, ball)
              // });
          // }
    }, this);

  }

  configCollision() {
    var graphics = this.add.graphics();

    this.layer.setCollisionByProperty({ collides: true, type: [ 'block' ] });
  }

  /**
   * 地图刷新
   */
  refreshMap() {

    // 初始化
    this.sx = this.sx || 0;
    this.times = this.times || 0;

    this.sx += this.data.pace;
    this.data.distance += this.data.pace;

    this.role.x += this.data.pace;

    // 16像素
    if (this.sx == 16) {
      //  Reset and create new strip
      let tile;

      // 数组地图域更新处理
      for (let y = 0; y < this.data.mapHeight; y++) {
        for (let x = 1; x < this.data.mapWidth; x++) {
          tile = this.layer.getTileAt(x, y);
          
          let newTile = this.layer.putTileAt(tile, x-1, y);
          let newCoinTile = this.coinLayer.putTileAt(tile, x-1, y);

          if (x === this.data.mapWidth - 1) {
            this.layer.putTileAt(-1, x, y);
            this.coinLayer.putTileAt(-1, x, y);
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
    // 背景
    this.background.tilePositionX += (this.data.pace / 4);
  }

  jump() {
    if (this.jumpTimes === undefined) {
      this.jumpTimes = 2;
    }

    if (this.jumpTimes > 0) {
      --this.jumpTimes;

      this.role.play('jump');
      //this.role.setVelocityY(this.data.jump);
      this.role.setGravityY(this.data.gravity)
      //上升时头朝上
      this.tweens.add({
        targets: this.role,
        angle: -15,
        duration: 100
      });

      this.role.stop('jump');
      // this.soundFly.play();
    }
  }

  hitCoin() {
    console.info('hit coin');
  }

  hitCheck(role, hitArea) {
    //console.info(hitArea);

    // 重置跳跃次数
    if (hitArea.index == 4) {
      this.jumpTimes = 2;
    } else {
      this.stopGame();
    }
    
  }

  startGame() {
    this.gameState = 'running';
    this.input.on('pointerdown', this.jump, this);

    this.endingTime = new Date() + 1200;
  }

  isGameStart() {
    return this.gameState == 'running';
  }

  stopGame() {
    this.gameState = 'stop';
    this.input.off('pointerdown', this.jump, this);
  }

  initLevel() {
    this.startTime = new Date();
    console.info('init');

    this.layer.putTileAt(4, 40, 17, true);
    this.layer.setCollisionBetween(0, 77);
  }
  /**
   * 
   * 
   */
  pickNextLevel() {
    // 抽取下一个地图进行渲染
    console.info('gen');
    this.endTime = new Date();
    this.interval = this.endTime - this.startTime;
    this.startTime = new Date();
      // pick next level
    this.levels = this.levels || 3;

    // 生成
    PARSER.genBlock(this.levels, this.layer);
    PARSER.genCoin(this.levels, this.coinLayer);

    this.levels++;

    // this.matter.world.convertTilemapLayer(this.layer);
    // this.matter.world.convertTilemapLayer(this.coinLayer);
     
    if (this.levels >= 17) {
      this.data.pace = 8;
    } else if (this.levels >= 11) {
      this.data.pace = 4;
    } else if (this.levels >= 5) {
      this.data.pace = 2;
    }
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
      case 'coin': 
        this.coinLayer.putTileAt(1, tileX, tileY, true).properties = {'type': 'coin'};
        break;
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
                                [35, 35]
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
    let tileColor = this.showTiles ? new Phaser.Display.Color(105, 210, 231, 200) : null;
    let colldingTileColor = this.showCollidingTiles ? new Phaser.Display.Color(243, 134, 48, 200) : null;
    let faceColor = this.showFaces ? new Phaser.Display.Color(40, 39, 37, 255) : null;

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

const params = {
  baseMapWidth: 40,
  mapWidth: 3 * 40,
  mapHeight: 20,
  distance: 0,
  gravity: 800,
  jump: -540,
  pace: 1,
  parser: PARSER,
};

const demo = new Phaser.Game({
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
    //default: "matter",
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },
});

demo.scene.add("demo", Demo, false, params);
