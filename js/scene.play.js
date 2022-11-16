/**
 * 游戏主场景
 */
class Play extends Phaser.Scene {
    constructor() {
      super({ key: "play", active: false });
    }
  
    preload() {
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

      // 距离测试
      this.text = this.add.text(16, 16, this.data, {
        fontSize: "12px",
        fill: "#ffffff",
      }).setScrollFactor(0).setDepth(100);

      // 星钻加成
      this.buffText = this.add.text(game.config.width/2, 16, this.data, {
        fontSize: "18px",
        fill: "#ffaaaa",
      }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0.5);
      this.buffText.setText('3% UP!');

      this.tweens.add({
        targets: this.buffText,
        delay: 0,
        x: 16*30,
        y: 16,
        duration: 1000,
        ease: 'Power0',
        easeParams: null,
        hold: 0,
        repeat: 0,
        repeatDelay: 0,
        yoyo: false,
        flipX: false,
        flipY: false
      });


      // 倒计时
      this.timeCountdownText = this.add.text(16*10, 16*5, this.data, {
        fontSize: "24px",
        fill: "#ffffff",
      }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0.5).setAlpha(0.5);
      this.timeCountdown = this.data.timeCountdown;

      // 背景板
      this.background = this.add.tileSprite(0, 0, 960, 524, 'background')
                      .setOrigin(0, 0)
                      .setScale(1, 0.65)
                      .setDepth(0)
                      .setAlpha(0.75)
                      .setScrollFactor(0);

      this.role = this.physics.add.sprite(2*16, 2*16, "role")
                      .setDepth(100)
                      .setScale(1)
                      .setGravityY(this.data.gravity)
                      // .setCollideWorldBounds(true)
                      .setBounce(0)
                      .setSize(16,30);
                  
          
      // 生成角色通用动画
      this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('role', { frames: [ 0, 1, 2, 3 ] }),
        frameRate: 8,
        repeat: -1
      });
      this.role.play('jump');

      // 物品组
      this.group = this.physics.add.staticGroup();

      this.initLevel();
      

      // 10ms 定时任务
      // 40*16 场景的过场时间为
      // pace, time
      // 1.6, 4000ms
      // 1.8, 3500ms
      // 2.1, 3000ms
      // 2.56, 2500ms
      // 3.2, 2000ms
      // 4.27, 1500ms
      // 6.4, 1000ms
      this.timedEvent = this.time.addEvent({ delay: 10, callback: this.updateBlock, callbackScope: this, loop: true });

      // 
      this.physics.add.collider(this.role, this.group, this.hitCheck, null, this);
  
      // 开始匹配
      this.start();
    }
  
    update(delta) {
      // 游戏未开始
      if (!this.data.isGameStart()) return;
      
      // 背景
      this.background.tilePositionX += this.data.pace * (1000 / delta);
  
      if (this.role.angle < 0) this.role.angle += 4.5; //下降时头朝下
      this.role.setGravityY(this.data.gravity);
      this.text.setText("Distance: " + (this.distance || 0) + "px, level:" + (this.level || 0) + ", cost: " + (this.interval || 0) + "ms");
      this.timeCountdownText.setText(''+ parseInt(this.timeCountdown/60000) + ':' + parseInt(this.timeCountdown/1000%60) +':' + parseInt(this.timeCountdown%1000));
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

    /**
     * 更新
     */
    updateBlock() {
      this.distance = this.distance || 0;
      this.timeCountdown -= 10;

      // 时间到结束游戏
      if (this.timeCountdown <= 0) {
        this.gameOver();
        return;
      }

      if (this.data.isGameStart()) {
        this.distance += this.data.pace;

        // 碰撞物左移
        this.group.children.each(function(tile) {
          tile.x -= this.data.pace;
          if (tile.body != undefined && tile.body != null) {
            tile.refreshBody();
          }

          // 出游戏左边删除
          if (tile.x < -16) {
            this.group.remove(tile, true, true);
          }
        }, this);

        // 最终回则不算
        if (this.distance - 640 >= 0) {
          this.distance = 0;
          this.pickNextLevel();
        }
      }
    }
  
    /**
     * 初始化游戏关卡
     */
    initLevel() {
      
      // 初始生成3关
      this.level = this.level || 3;

      for (let y=18; y<20; y++) {
        for (let x=0; x<40; x++) {
          let tile = this.group.create(16*x, 16*y, 'tiles', 4, true, true).setName('block').setOrigin(0, 0).setDepth(50);
          tile.refreshBody();
        }
      }

      this.data.parser.genLevel(2, this.group, true, 'block', 40, 0, null, null);
      this.data.parser.genLevel(2, this.group, true, 'coin', 40, 0, null, null);

      this.data.parser.genLevel(3, this.group, true, 'block', 80, 0, null, null);
      this.data.parser.genLevel(3, this.group, true, 'coin', 80, 0, null, null);

    }
    /**
     *10ms 定时任务
      40*16 场景的过场时间为
      pace, time
      1.6, 4000ms
      1.8, 3500ms
      2.1, 3000ms
      2.56, 2500ms
      3.2, 2000ms
      4.27, 1500ms
      6.4, 1000ms
     */
    pickNextLevel() {
      // 抽取下一个地图进行渲染
      console.info('gen');
      this.endTime = new Date();
      this.interval = this.endTime - this.startTime;
      this.startTime = new Date();
      
      ++this.level;
      // 生成
      this.data.parser.genAll(this.level, this.group);
      
      if (this.level > 41) {
        this.data.pace = 6.4;
      } else if (this.level > 27) {
        this.data.pace = 4.27;
      } else if (this.level > 17) {
        this.data.pace = 3.2;
      } else if (this.level > 11) {
        this.data.pace = 2.1;
      } else if (this.level > 5) {
        this.data.pace = 1.8;
      }
      
    }
  

    // 模拟匹配
    match() {
      this.matchingText = this.add.bitmapText(game.config.width/2 + 20, 80, {
                                    fontSize: "18px",
                                    padding: { x: 10, y: 5 },
                                    fill: "#ffffff",
                                    backgroundColor: "#000000",
                                  }, "MATCHING", 50)
                                  .setOrigin(0.5, 0.5)
                                  .setAlpha(0.8)
                                  .setScale(1.2)
                                  .setDepth(100);
      this.tweens.add({
        targets: this.matchingText,
        x: game.config.width/2 - 20,
        duration: 1000,
        yoyo: true,
        repeat: 0,
        ease: 'Sine.easeInOut',
        callbackScope: this,
        onComplete: this.ready
      });
  
      this.playTip = this.add.image(game.config.width / 2, 350, "play_tip").setDepth(150).setAlpha(0.7); // 提示点击
      this.tweens.add({
        targets: this.playTip,
        y: 310,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        duration: 1000, 
        loop: true
      });
    }
  
    ready() {
      this.matchingText.destroy();
      let repeats = 0, countDown = 3;
  
      // this.readyText = this.add.image(game.config.width / 2, 20, "ready_text").setDepth(150); // 准备
      this.readyText = this.add.bitmapText(game.config.width/2, 80, "flappy_font", "READY", 50).setOrigin(0.5, 0.5).setDepth(150);
      this.tweens.add({
        targets: this.readyText,
        duration: 1000,
        alpha: 0,
        repeat: 3,
        yoyo: false,
        ease: 'Linear',
        onRepeatScope: this,
        onRepeat: function() {
            this.readyText.text = countDown--;
        },
        onCompleteScope: this,
        onComplete: function() {
          this.readyText.destroy();
  
          this.goText = this.add.bitmapText(game.config.width/2, 80, "flappy_font", "GO", 50).setOrigin(0.5, 0).setDepth(100).setScale(0.9);
          this.tweens.add({
            targets: this.goText,
            duration: 500, 
            scale: 1.5,
            alpha: 0.5,
            yoyo: false,
            ease: 'Sine.easeInOut',
            onCompleteScope: this,
            onComplete: function() {
              this.goText.destroy();
              this.start()
            }
          });
        }
      });
    }
  
    start() {
      this.input.once('pointerdown', this.startGame, this);
    }
  
    startGame() {
      //console.info(new Date(), this.role.y)
      // this.readyText.destroy();
      //this.playTip.destroy();
  
      this.data.setGameStart();
  
      // this.scoreText = this.add.bitmapText(game.config.width / 2 - 20, 50, {
      //                             fontSize: "18px",
      //                             padding: { x: 10, y: 5 },
      //                             fill: "#ffffff",
      //                           }, "0", 36).setDepth(100);
      // this.enemyScoreText = this.add.bitmapText(game.config.width / 2 + 90, 20, "flappy_font", "VS 0", 20).setDepth(100);
      // this.enemyScoreText.setTint(0xffffff, 0xffffff, 0xff5555, 0xff5555);
  
      // 事件
      this.input.on('pointerdown', this.jump, this);
    }
  
    stopGame() {
      this.data.setGameStop();
  
      // this.scoreText.destroy();
      // this.enemyScoreText.destroy(); 
      
      this.role.anims.stop("jump", 0);
      this.input.off('pointerdown', this.jump, this);
      this.time.shutdown();
    }  
  
    /**
     * 角色跳跃
     */
    jump() {
      if (this.jumpTimes === undefined) {
        this.jumpTimes = 2;
      }
  
      if (this.jumpTimes > 0) {
        --this.jumpTimes;
  
        this.role.play('jump');

        this.role.setVelocityY(this.data.jump);
        //this.role.setGravityY(this.data.jump);
        //上升时头朝上
        this.tweens.add({
          targets: this.role,
          angle: -45,
          duration: 100
        });
  
        this.role.stop('jump');
        // this.soundFly.play();
      }
    }
  
    /**
     * 
     * @returns 
     */
    hitCheck(role, tile) {
      if (this.data.isGameStop()) return;

      if (tile.body.touching.up && tile.name == 'block') {
        this.jumpTimes = 2;
        return;
      }

      if (tile.name == 'coin') {
        this.score++;
        return;
      }

      this.gameOver();
    }
  
    gameOver() {
      this.data.setGameStop();
      this.stopGame();

      this.role.setCollideWorldBounds(false);
      this.group.setActive(false);
      this.tweens.add({
        targets: this.role,
        y: this.role.y - 50,
        ease: 'ease',
        duration: 300,
      });
      
      this.submitResult();
    }
  
    submitResult() {
      let limit = (this.data.endTime - this.data.startTime) / 1000 + 5;
      console.debug(limit);
  
      if (this.data.count > limit || this.data.count > this.data.pipeGens) {
        alert("检测到数据异常，本局游戏将不会记录");
        this.data.checkPlayPoints(this.showGameOverText.bind(this));
      } else {
        this.data.saveScore(this.data.checkPlayPoints.bind(this.data), this.showGameOverText.bind(this));
      }
    }
  
    showGameOverText() {
  
      this.scoreText.destroy();
      if (this.resultText) {
        this.resultText.destroy();
      }
  
      this.data.bestScore = this.data.bestScore || 0;
      this.data.historyScore = this.data.historyScore || 0;
  
      // 更新最佳连胜
      // if (this.data.score > this.data.bestScore) this.data.bestScore = this.data.score; 
      // 更新历史连胜
      // this.data.historyScore = this.data.historyScore + this.data.score;
  
      this.gameOverGroup = this.add.group(); //添加一个组
  
      //game over 文字图片
      //let gameOverText = this.gameOverGroup.create(game.config.width/2, 60, "game_over").setDepth(150); 
  
      // 0分重试
      let font = this.data.count == 0 ? "RETRY" : this.data.hasPlayPoints ? "VICTORY" : "DEFEAT";
      let resultText = this.add.bitmapText(game.config.width/2, 50, "flappy_font", font, 50, this.gameOverGroup)
                              .setOrigin(0.5, 0)
                              .setAlpha(0.9)
                              .setDepth(100)
                              .setScale(1.2);
  
      this.data.count == 0 ? resultText.setTint(0xffffff, 0xffffff, 0xF99057, 0xF99057) : 
      this.data.hasPlayPoints ? resultText.setTint(0xffffff, 0xffffff, 0xfce95f, 0xfce95f) : resultText.setTint(0xffffff, 0xffffff, 0xadada8, 0xadada8);                     
       
  
      // 分数板
      let scoreboard = this.gameOverGroup.create(game.config.width/2, 185, "score_board").setDepth(150); 
  
      // 当前连胜次数
      let currentScoreText = this.add.bitmapText(game.config.width/2 + 60, 165, "flappy_font", this.data.score, 20, this.gameOverGroup)
                                  .setDepth(150)
                                  .setOrigin(0.5, 0); 
      // 最佳连胜次数
      let bestScoreText = this.add.bitmapText(game.config.width/2 + 60, 210, "flappy_font", this.data.bestScore, 20, this.gameOverGroup)
                                  .setDepth(150)
                                  .setOrigin(0.5, 0);
      // 累计获胜次数
      let HistoryScoreText = this.add.bitmapText(game.config.width/2 - 55, 165, "flappy_font", this.data.historyScore, 20, this.gameOverGroup)
                                  .setDepth(150)
                                  .setOrigin(0.5, 0);
      
      let shareBtnPosX = game.config.width / 2;
  
      if (this.data.hasPlayPoints) {
        shareBtnPosX += 60;
  
        let replayBtn = this.gameOverGroup.create(game.config.width / 2 - 60, 300, "btn").setDepth(200).setInteractive();
        replayBtn.once('pointerup', function () {
          this.scene.stop('play');
          this.data.reset();
          this.scene.restart(params);
        }, this);
      }
  
      let shareBtn = this.gameOverGroup.create(shareBtnPosX, 300, "share").setDepth(200).setInteractive();
      shareBtn.once('pointerup', function () {
        this.scene.stop('play');
        // 分享按钮
        window.location.href = this.data.shareLink();
      }, this);
  
    }
  
    // 检测分数
    checkScore(pipe) {
      // console.log(pipe);
      // 负责分数的检测和更新
      // let star = undefined;
  
      // star.setActive(false);
      // star.setState('scored');
    }
  
    // 更新对手分数
    checkEnemyScore() {
      
      this.enemyScoreText.text = 'VS ' + this.data.enemyCount;
  
      if (!this.data.winner && this.data.enemyCount < this.data.count - 1) {
        this.data.winner = true;
  
        this.resultText = this.add.bitmapText(game.config.width/2, game.config.height/2 - 20, "flappy_font", "VICTORY", 60)
                              .setOrigin(0.5, 0.5)
                              .setAlpha(0.05)
                              .setDepth(10)
                              .setScale(1.2);
        
        this.resultText.setTint(0xffffff, 0xffffff, 0xfce95f, 0xfce95f);                   
  
        this.tweens.add({
          targets: this.resultText,
          duration: 2000, 
          alpha: 0.1,
          repeat: -1,
          loop: true,
          yoyo: false,
          ease: 'Sine.easeInOut',
          onCompleteScope: this,
          onComplete: function() {
            this.resultText.destroy(); 
          }
        });
      }
    }
  }