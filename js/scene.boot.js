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
      // this.hour = new Date().getHours;
      // if (this.hour >= 6 &&  this.hour <= 18) {
      //   this.load.image("background", "assets/background.png");
      // } else {
      //   this.load.image("background", "assets/background2.png");
      // }
      
      this.load.image("background", "assets/background" + (Math.random() > 0.5 ? "" : "2") + ".png");
    }
  
    create() {
      this.data = this.scene.settings.data;

      this.data.parser.init();
  
      // 背景板
      this.background = this.add.tileSprite(0, 0, 960, 524, 'background')
                              .setOrigin(0, 0)
                              .setScale(1, 0.65)
                              .setDepth(0)
                              .setAlpha(0.95)
                              .setScrollFactor(0);

      this.group = this.physics.add.staticGroup();

      for (let y=18; y<20; y++) {
        for (let x=0; x<80; x++) {
          let tile = this.group.create(16*x, 16*y, 'tiles', 4).setOrigin(0, 0);
          tile.refreshBody();
        }
      }
      
      this.role = this.add.sprite(128, 16*16, "role")
                      .setDepth(100)
                      .setScale(1.5);
                  
          
      // 生成角色通用动画
      this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('role', { frames: [ 0, 1, 2, 3 ] }),
        frameRate: 8,
        repeat: -1
      });
      this.role.play('jump');

      this.tweens.timeline({
        targets: this.role,
        loop: -1,
        tweens: [
        {
            x: 256,
            y: 16*16,
            ease: 'Sine.easeOut',
            duration: 1000,
            offset: 0,
        },
        {
            y: 10*16,
            x: 290,
            angle: -15,
            ease: 'Expo',
            duration: 1000,
        },
        {
            y: 16*16,
            x: 280,
            angle: 15,
            ease: 'Expo',
            duration: 500
        },
        {
          y: 16*16,
          x: 270,
          angle: -15,
          ease: 'Expo',
          duration: 200
        },
        {
            x: 128,
            y: 16*16,
            angle: 0,
            ease: 'Sine.easeOut',
            duration: 3000
        }
        ]

    });


      // 标题组
      this.title = this.add.text(0, 48, 'LUCKY RUN', {
        fontSize: "48px",
        padding: { x: 10, y: 5 },
        fill: "#fff",
      }).setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0);
  
      // 动效
      this.tweens.add({
        targets: this.title,
        x: game.config.width/2,
        loop: true,
        duration: 16000,
        ease: 'Quintic.easeInOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: 1000,
      });
  
      /**
       * 检测游戏次数
       */
      this.data.checkPlayPoints(() => {
  
        this.message = this.add.text(16*20, 128, (this.data.hasPlayPoints ? "START" : "SHARE"), { 
          font: "24px Arial Black", 
          fill: "#fff",
        }).setScrollFactor(0)
        .setDepth(100)
        .setOrigin(0, 0);

        this.message.setStroke('#f77234', 4);
        this.message.setShadow(2, 2, "#333333", 2, true, true);

        this.tweens.add({
          delay: 2000,
          targets: this.message,
          x: this.message.x + 20,
          duration: 500,
          ease: 'Quintic.easeInOut',
          yoyo: true,
          repeat: -1,
          repeatDelay: 4000,
        });

        this.input.once('pointerdown', function() {
          //开始按钮
          if (this.data.hasPlayPoints) {
            this.data.historyScore = this.data.historyScore || 0;
            this.data.bestScore = this.data.bestScore || 0;
  
            // 切换场景
            this.scene.transition({
              target: 'play', 
              duration: 200,
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
  
    update(delta) {
      // 背景
      this.background.tilePositionX += this.data.pace * (1000 / delta);
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