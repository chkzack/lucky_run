/**
 * 初始场景
 */
class Boot extends Phaser.Scene {
    constructor() {
      super({ key: "boot", active: true });
    }
  
    preload() {
  
      this.loadingBar();
  
      //以下为要加载的资源
      this.load.image("loading", "assets/preloader1.gif");
  
      this.load.image("background", "assets/background-ocean1.png"); //背景
      this.load.image("ground", "assets/ground-ocean.png"); //地面
      this.load.image("sky", "assets/sky-ocean.png"); //天花板
  
      this.load.image("title", "assets/title1.png"); //游戏标题
      // { frameWidth: 32, frameHeight: 38 }  
      // 29, 24, 3
      this.load.spritesheet("fish", "assets/fish1.png", { frameWidth: 29, frameHeight: 24 , startFrame: 0, endFrame: 2}); //鱼
  
      this.load.image("btn", "assets/start-button.png"); //按钮
      this.load.image("share", "assets/share-button1.png"); //分享按钮
    }
  
    create() {
      this.data = this.scene.settings.data;
  
      this.background = this.add.tileSprite(0, 0, game.config.width, game.config.height, "background").setOrigin(0, 0); //背景图
      this.ground = this.add.tileSprite(0, game.config.height - 56, game.config.width, 56, "ground").setOrigin(0, 0); //地板
  
      // 标题
      this.titleGroup = this.add.group();
      let title = this.titleGroup.create(50, 100, "title").setOrigin(0, 0); 
      let fish = this.titleGroup.create(240, 110, 'fish').setOrigin(0, 0); 
  
      // 生成鱼通用动画
      this.anims.create({
        key: 'swim',
        frames: this.anims.generateFrameNumbers('fish', { frames: [ 0, 1, 2 ] }),
        frameRate: 8,
        repeat: -1
      });
      fish.play('swim');
  
      // TODO
      this.tweens.add({
        targets: this.titleGroup,
        x: 70,
        loop: true,
        duration: 3000,
        ease: 'Quintic.easeInOut',
        duration: 1200,
        yoyo: true,
        repeat: -1,
      }); 
  
      /**
       * 开始检测
       */
      this.data.checkPlayPoints(() => {
  
        let btn = this.add.sprite(game.config.width/2, game.config.height/2 + 40, this.data.hasPlayPoints ? "btn" : "share").setInteractive();
        btn.once('pointerup', function() {
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
        
        btn.setOrigin(0.5, 0.5);
      });
    }
  
    update() {
      this.background.tilePositionX -= 1;
      this.ground.tilePositionX -= 2;
    }
  
    loadingBar() {
      // 加载进度条
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