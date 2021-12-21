/**
 * 加载初始场景
 */
class Boot extends Phaser.Scene {
    constructor() {
      super({ key: "boot", active: true });
    }
  
    preload() {
  
      // 加载进度条
      this.loadingBar();
  
      //以下为要加载的资源
      this.debugGraphics = this.add.graphics();
      this.data = this.scene.settings.data;
      this.load.spritesheet("tiles", "assets/base.png", { frameWidth: 16, frameHeight: 16 });

      // 角色
      this.load.spritesheet("role", "assets/animations/role.png", { frameWidth: 32, frameHeight: 32 , startFrame: 0, endFrame: 3});

      // 根据时间切换场景
      this.hour = new Date().getHours;
      if (Math.random() > 0.5) {
      // if (hour >= 6 &&  hour >= 18) {
        this.load.image("background", "assets/background.png");
      } else {
        this.load.image("background", "assets/background2.png");
      }
      
    }
  
    create() {
      this.data = this.scene.settings.data;

      this.data.parser.init();
  
      // 背景板
      this.background = this.add.tileSprite(0, 0, 960, 524, 'background')
                              .setOrigin(0, 0)
                              .setScale(1, 0.6)
                              .setDepth(0)
                              .setAlpha(0.95)
                              .setScrollFactor(0);

      this.group = this.physics.add.staticGroup();

      for (let y=18; y<20; y++) {
        for (let x=0; x<40; x++) {
          let tile = this.group.create(16*x, 16*y, 'tiles', 4).setOrigin(0, 0);
        }
      }
      

      // 标题组
      this.title = this.add.text(0, game.config.height/2 - 64, 'LUCKY RUN', {
        fontSize: "48px",
        padding: { x: 10, y: 5 },
        fill: "#ffffff",
      }).setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0.5, 0.5)
      //.setDisplayOrigin(0.5, 0.5)
      .setTint(6);
  
      // 动效
      this.tweens.add({
        targets: this.title,
        x: game.config.width,
        loop: true,
        duration: 8000,
        ease: 'Quintic.easeInOut',
        yoyo: false,
        repeat: -1,
      }); 
  
      /**
       * 检测游戏次数
       */
      this.data.checkPlayPoints(() => {
  
        this.message = this.add.text(game.config.width/2, game.config.height/2 + 64, (this.data.hasPlayPoints ? "点击开始" : "分享"), {
          fontSize: "48px",
          padding: { x: 10, y: 5 },
          fill: "#ffffff",
        }).setScrollFactor(0)
        .setDepth(100)
        .setOrigin(0.5, 0.5)
        //.setDisplayOrigin(0.5, 0.5)
        .setTint(0);

        this.input.once('pointerdown', function() {
          //开始按钮
          if (this.data.hasPlayPoints) {
            this.data.historyScore = this.data.historyScore || 0;
            this.data.bestScore = this.data.bestScore || 0;
  
            // 切换场景
            this.scene.transition({
              target: 'play', 
              duration: 1000,
              allowInput: false,
              remove: true,
              moveAbove: true,
              onUpdate: function() {
                // console.info('trans');
              },
              onUpdateScope: this, 
              data: params
            })
            // this.scene.add('play', Play, true, params);
  
          } else {
            window.location.href = this.data.shareLink();
          }
        }, this);
        
        // btn.setOrigin(0.5, 0.5);
      });
    }
  
    update() {
      // 背景
      this.background.tilePositionX += (this.data.pace / 4);
    }
  
    updateBlock() {
      this.group.children.each(function(gameObject) {
        gameObject.x -= 2;
        if (gameObject.x < -16) {
          this.group.remove(gameObject, true, true);
        }
      }, this)
    }

    /**
     * 加载进度条
     */
    loadingBar() {
      let progress = this.add.graphics();
  
      this.load.on('progress', function (value) {
          progress.clear();
          progress.fillStyle(0xffffff, 1);
          progress.fillRect(0, 270, 800 * value, 60);
      });
  
      this.load.on('complete', function () {
          progress.destroy();
      }); 
    }
  
  }