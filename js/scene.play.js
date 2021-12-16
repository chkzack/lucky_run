/**
 * 游戏主场景
 */
class Play extends Phaser.Scene {
    constructor() {
      super({ key: "play", active: false });
    }
  
    preload() {

      this.debug = this.add.graphics();
  
      // this.loadingBar();
      // 50, 318, 2
      this.load.spritesheet("pipe", "assets/pipes1.png", { frameWidth: 50, frameHeight: 318 }); //管道
      this.load.bitmapFont("flappy_font", "assets/fonts/flappyfont/flappyfont.png", "assets/fonts/flappyfont/flappyfont.fnt");
  
      this.load.audio("fly_sound", "assets/flap.wav"); //飞翔的音效
      this.load.audio("score_sound", "assets/score.wav"); //得分的音效
      this.load.audio("hit_pipe_sound", "assets/pipe-hit.wav"); //撞击管道的音效
      this.load.audio("hit_ground_sound", "assets/ouch.wav"); //撞击地面的音效
  
      this.load.image("ready_text", "assets/get-ready.png");
      this.load.image("play_tip", "assets/instructions1.png");
      this.load.image("game_over", "assets/gameover.png");
      this.load.image("score_board", "assets/scoreboard_2.png");
    }
  
    create() {
      this.data = this.scene.settings.data;
  
      this.background = this.add
                      .tileSprite(0, 0, game.config.width, game.config.height, "background")
                      .setDisplayOrigin(0, 0)
                      .setDepth(0); //背景图
      this.ground = this.add
                      .tileSprite(0, game.config.height - 16, game.config.width, 16, "ground")
                      .setDisplayOrigin(0, 0)
                      .setDepth(100); //地板
  
      this.groundGroup = this.physics.add.staticGroup();
      this.groundGroup.add(this.ground);
  
      // 刷新静态地面
      this.physics.add.existing(this.ground, true);
      this.ground.body.updateFromGameObject();
      
      this.fish = this.physics.add
                      .sprite(50, 150, "fish")
                      .setDepth(100)
                      .setGravityY(0)
                      .setCollideWorldBounds(true)
                      .setBounce(0)
                      .play('swim');
  
      this.pipeGroup = this.physics.add.group();
  
      this.soundFly = this.sound.add("fly_sound");
      this.soundScore = this.sound.add("score_sound");
      this.soundHitPipe = this.sound.add("hit_pipe_sound");
      this.soundHitGround = this.sound.add("hit_ground_sound");
      
  
      this.physics.add.collider(this.fish, this.groundGroup, function() {
        // console.info(new Date());
        this.stopGame();
      }, null, this); //与地面碰撞
      this.physics.add.collider(this.fish, this.pipeGroup, this.hitGroundCheck, null, this); //与管道碰撞
  
      // 开始匹配
      this.start();
    }
  
    update() {
      // 游戏未开始
      if (!this.data.isGameStart()) return;
  
      let scrollSpeed = parseInt(this.data.gameSpeed/100);
      this.background.tilePositionX += scrollSpeed;
      this.ground.tilePositionX += scrollSpeed;
  
      if (this.fish.angle < 90) this.fish.angle += 2.5; //下降时头朝下
  
      let checkList = this.pipeGroup.getMatching('active', true);
  
      // console.debug(checkList);
      //分数检测和更新
      checkList.forEach(this.checkScore, this); 
      this.checkEnemyScore();
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
  
    // 模拟匹配
    match() {
      this.matchingText = this.add.bitmapText(game.config.width/2 + 20, 80, "flappy_font", "MATCHING", 50)
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
      console.info(new Date(), this.fish.y)
      // this.readyText.destroy();
      //this.playTip.destroy();
  
      this.data.setGameStart();
  
      this.scoreText = this.add.bitmapText(game.config.width / 2 - 20, 50, "flappy_font", "0", 36).setDepth(100);
      this.enemyScoreText = this.add.bitmapText(game.config.width / 2 + 90, 20, "flappy_font", "VS 0", 20).setDepth(100);
      this.enemyScoreText.setTint(0xffffff, 0xffffff, 0xff5555, 0xff5555);
  
      // 事件
      this.fish.setGravityY(this.data.gravity);
      this.input.on('pointerdown', this.swim, this);
  
      // 生成地图块
      this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: this.generateTileMapBlock,
        callbackScope: this,
        timeScale: this.data.timeScale
      })
    }
  
    stopGame() {
      this.data.setGameStop();
  
      this.scoreText.destroy();
      this.enemyScoreText.destroy(); 
      
      this.pipeGroup.setVelocity(0, 0);
      this.fish.anims.stop("swim", 0);
      this.input.off('pointerdown', this.swim, this);
      this.time.shutdown();
    }  
  
    swim() {
      this.fish.setVelocityY(-this.data.gravity);
      //上升时头朝上
      this.tweens.add({
        targets: this.fish,
        angle: -30,
        duration: 100
      });
  
      this.soundFly.play();
    }
  
    hitPipeCheck() {
      if (this.data.isGameStop()) return;
      this.soundHitPipe.play();
      this.gameOver();
    }
  
    hitGroundCheck() {
      if (this.data.isGameStop()) return;
      this.soundHitGround.play();
      this.gameOver();
    }
  
    gameOver() {
      this.gap = undefined;
      this.data.setGameStop();
      this.stopGame();
      
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
  
    // 生成区块地图
    generateTileMapBlock() {
  
      console.info(new Date(), this.fish.y)
      // 使用回收
      // if (this.resetPipe(topPipeY, bottomPipeY)) return;
      // console.debug(topPipeY, bottomPipeY);
  
      // this.pipeGroup.setVelocity(-this.data.gameSpeed, 0);
    }
  
    resetPipe(topPipeY, bottomPipeY) {
      // 重置边界地图块
  
      // 如果 
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