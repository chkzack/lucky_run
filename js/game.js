/**
 * 更新phaser版本到3.55.2
 */

/**
 * 启动页面
 */
class Boot extends Phaser.Scene {
  constructor() {
    super({ key: "boot", active: true });
  }

  preload() {

    // loadingBar();

    //以下为要加载的资源
    this.load.image("loading", "assets/preloader1.gif");

    this.load.image("background", "assets/background-ocean1.png"); //背景
    this.load.image("ground", "assets/ground-ocean.png"); //地面

    this.load.image("title", "assets/title.png"); //游戏标题
    // { frameWidth: 32, frameHeight: 38 }  
    // 29, 24, 3
    this.load.spritesheet("fish", "assets/bird.png", { frameWidth: 29, frameHeight: 24 , startFrame: 0, endFrame: 2}); //鱼

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
    this.background.tilePositionX += 1;
    this.ground.tilePositionX += 2;
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

class Play extends Phaser.Scene {
  constructor() {
    super({ key: "play", active: false });
  }

  preload() {
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
                    .tileSprite(0, game.config.height - 56, game.config.width, 56, "ground")
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
    
    this.physics.add.collider(this.fish, this.groundGroup, this.hitPipeCheck, null, this); //与地面碰撞
    this.physics.add.collider(this.fish, this.pipeGroup, this.hitGroundCheck, null, this); //与管道碰撞

    // 开始匹配
    this.match();
  }

  update() {
    // 游戏未开始
    if (!this.data.isGameStart()) return;

    let scrollSpeed = parseInt(this.data.gameSpeed/100);
    this.background.tilePositionX += scrollSpeed;
    this.ground.tilePositionX += scrollSpeed;

    // this.physics.overlap(this.fish, this.ground, this.hitCheck, null, this); 
    // this.physics.collide(this.fish, this.pipeGroup, this.hitCheck, null, this); //与管道碰撞

    if (this.fish.angle < 90) this.fish.angle += 2.5; //下降时头朝下

    let checkList = this.pipeGroup.getMatching('active', true);

    // console.debug(checkList);
    //分数检测和更新
    checkList.forEach(this.checkScore, this); 
    this.checkEnemyScore();
  }

  // 模拟匹配
  match() {
    this.matchingText = this.add.bitmapText(game.config.width / 2 + 20, 40, "flappy_font", "MATCHING", 30).setOrigin(0.5, 0).setDepth(100);
    this.tweens.add({
      targets: this.matchingText,
      x: game.config.width / 2 - 20,
      alpha: 0.8,
      duration: 600,
      yoyo: true,
      repeat: 1,
      callbackScope: this,
      onComplete: this.ready
    });

    this.playTip = this.add.image(game.config.width / 2, 330, "play_tip").setDepth(150).setAlpha(0.7); // 提示点击
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
    this.readyText = this.add.bitmapText(game.config.width/2, 30, "flappy_font", "READY", 40).setOrigin(0.5, 0).setDepth(150);
    this.tweens.add({
      targets: this.readyText,
      duration: 800,
      alpha: 0,
      repeat: 4,
      yoyo: false,
      ease: 'Sine.easeInOut',
      onRepeatScope: this,
      onRepeat: function() {
        if (++repeats > 1) {
          this.readyText.text = countDown--;
        }
      },
      onCompleteScope: this,
      onComplete: function() {
        this.readyText.destroy();

        this.goText = this.add.bitmapText(game.config.width/2, 30, "flappy_font", "GO", 40).setOrigin(0.5, 0).setDepth(100).setScale(0.9);
        this.tweens.add({
          targets: this.goText,
          duration: 500, 
          scaleX: 1.2,
          scaleY: 1.5,
          alpha: 0.5,
          yoyo: false,
          ease: 'Sine.easeInOut',
          onCompleteScope: this,
          onComplete: function() {
            this.goText.destroy();
            this.input.once('pointerdown', this.startGame, this); 
          }
        });
      }
    });
  }

  startGame() {
    // this.readyText.destroy();
    this.playTip.destroy();

    this.data.setGameStart();

    this.scoreText = this.add.bitmapText(game.config.width / 2 - 20, 30, "flappy_font", "0", 36).setDepth(100);
    this.enemyScoreText = this.add.bitmapText(game.config.width / 2 + 80, 10, "flappy_font", "VS 0", 20).setDepth(100);
    this.enemyScoreText.setTint(0x9999ee, 0x9999ee, 0x9999ee, 0x9999ee);

    // 事件
    this.fish.setGravityY(this.data.gravity);
    this.input.on('pointerdown', this.swim, this);

    // 添加管子生成事件
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.generatePipes,
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
    this.fish.setVelocityY(-350);
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
    setTimeout(() => {
      let limit = (this.data.endTime - this.data.startTime) / 1000 + 5;
      console.debug(limit);

      if (this.data.score > limit || this.data.score > this.data.pipeGens) {
        alert("检测到数据异常，本局游戏将不会记录");
      } else {
        this.data.saveScore();
      }

      this.data.checkPlayPoints();

      this.showGameOverText();

    }, 20, this);
  }

  showGameOverText() {
    this.scoreText.destroy();
    this.data.bestScore = this.data.bestScore || 0;
    this.data.historyScore = this.data.historyScore || 0;

    // 更新最佳连胜
    if (this.data.score > this.data.bestScore) this.data.bestScore = this.data.score; 
    // 更新历史连胜
    this.data.historyScore = this.data.historyScore + this.data.score;

    this.gameOverGroup = this.add.group(); //添加一个组

    let gameOverText = this.gameOverGroup.create(game.config.width/2, 60, "game_over").setDepth(150); //game over 文字图片
    let scoreboard = this.gameOverGroup.create(game.config.width/2, 185, "score_board").setDepth(150); //分数板

    // 当前连胜次数
    let currentScoreText = this.add.bitmapText(game.config.width/2 + 60, 165, "flappy_font", this.data.score + "", 20, this.gameOverGroup).setDepth(150); 
    // 最佳连胜次数
    let bestScoreText = this.add.bitmapText(game.config.width/2 + 60, 210, "flappy_font", this.data.bestScore + "", 20, this.gameOverGroup).setDepth(150);
    // 累计获胜次数
    let HistoryScoreText = this.add.bitmapText(game.config.width/2 - 55, 165, "flappy_font", this.data.historyScore + "", 20, this.gameOverGroup).setDepth(150);
    
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

  generatePipes() {
    //制造管道
    let score = this.data.score;
    /**
     * 上下间距
     */
    this.gap = this.gap || 220; //上下管道之间的间隙宽度
    /**
     * 管道振幅函数
     * 小于20时，震荡
     * 大于20时，随机
     * 默认 随机 0.8 * Math.Random()
     */
    let postionFloatRandom = 0.05 + 0.95 * Math.random();

    if (this.data.debug) {
      // 震荡函数 0.5 + 0.1*sin(2PI)
      postionFloatRandom = 0.5 + 0.2 * Math.sin((Math.PI * score) / 10);
      this.gap -= 2;
    } else if (score < 20) {
        // 震荡函数 0.5 + 0.1*sin(2PI)
        postionFloatRandom = 0.5 + 0.2 * Math.sin((Math.PI * score) / 10);
    } else if (score >= 20 && score < 40) {
        // 震荡函数 0.5 + 0.5*x*sin(2PI)
        postionFloatRandom = 0.5 + ((0.3 * score) / 40) * Math.sin((Math.PI * score) / 2);
    } else if (this.gap > 60) {
        this.gap -= 1;
    } else if (this.gap > 52) {
        this.gap -= 2;
    }

    let gap = this.gap > 50 ? this.gap : 50;

    /**
     * 基准位置
     * 上部阻碍物的底边缘 0 < position < 320
     * gap < 180
     * 地板 112
     */
    // let position = (game.config.height - 160 - gap) + Math.floor((- 112 - 30 + 480) * postionFloatRandom);
    let position = (game.config.height - 112 - gap - 30) * postionFloatRandom;

    let topPipeY = position - 320;
    let bottomPipeY = position + gap;

    // 使用回收
    if (this.resetPipe(topPipeY, bottomPipeY)) return;
    // console.debug(topPipeY, bottomPipeY);

    //
    let topPipe = this.pipeGroup
                      .create(game.config.width, topPipeY, "pipe", 0)
                      .setOrigin(0, 0)
                      .setDepth(50)
                      .setState('unscored')
                      .setActive(true)
                      .setSize(40, 310)
                      .setBounce(0)
                      .setImmovable(true);

    let botPipe = this.pipeGroup
                      .create(game.config.width, bottomPipeY, "pipe", 1)
                      .setOrigin(0, 0)
                      .setDepth(50)
                      .setState('unscored')
                      .setActive(true)
                      .setSize(40, 310)
                      .setBounce(0)
                      .setImmovable(true);

    this.data.pipeGens += 2;

    this.pipeGroup.setVelocity(-this.data.gameSpeed, 0);
  }

  resetPipe(topPipeY, bottomPipeY) {
    //重置出了边界的管道，做到回收利用
    let i = 0;
    // 非激活状态
    let deadList = this.pipeGroup.getMatching('active', false);

    console.debug('deadList', deadList)
    
    deadList.forEach(function(pipe) {
        // 超过2不重置且删除
        if (i >= 2) {
          // this.pipeGroup.remove(pipe, true, true);
          return;
        }

        pipe.setY(pipe.y <= 0 ? topPipeY : bottomPipeY)
          .setX(game.config.width)
          .setOrigin(0, 0)
          .setDepth(50)
          .setActive(true)
          .setState('unscored')
          .setImmovable(true)
          .setVelocityX(-this.data.gameSpeed);

        i++;
        this.data.pipeGens++;
    }, this);

    //如果 i>=2 代表有一组管道已经出了边界，可以回收这组管道了
    return i >= 2; 
  }

  checkScore(pipe) {
    //console.log(pipe);
    // 负责分数的检测和更新
    if (pipe.x <= this.fish.x - 17 - 54) {
      // 积分只检测上边
      if (pipe.y <= 0) {
        pipe.hasScored = true;

        this.scoreText.text = ++this.data.count;

        if (this.data.count % 5 == 0) {
          this.data.timeArray.push(new Date().toLocaleString());
        }
  
        this.data.gameSpeed += this.data.debug? 5: this.data.gameSpeedDelta;
        // this.data.timeScale += 0.01;
        this.soundScore.play();
        // 发送数据
        this.data.sendWebSocket();
      }

      pipe.setActive(false);
      pipe.setState('scored');
    }
    
  }

  checkEnemyScore() {
    // 更新对手分数
    this.enemyScoreText.text = 'VS ' + this.data.enemyCount;
  }
}

const params = {
  debug: true,

  // 通讯参数
  webSocket: undefined,
  host: window.location.host,
  userInfo: JSON.parse(window.localStorage.getItem("userInfo")),

  activityId: 10,
  code: "",
  token: "",
  uid: "",
  parsed: false,
  rivalMessage: {},
  // 活动标识
  activity_num: this.userInfo && this.userInfo.activity_id ? this.userInfo.activity_id : undefined,

  // 游戏参数
  // 0 初始 1 开始 2 结束
  GAME_INIT: 0,
  GAME_START: 1,
  GAME_STOP: 2,
  gameState: this.GAME_INIT, 

  gameSpeed: 200,
  gameSpeedDelta: 2,
  timeScale: 1.0,
  gravity: 1150,
  pipeGens: 0,

  // 过关数
  count: 0,
  enemyCount: 0,
  // 当前连胜
  score: 0,
  // 最高连胜
  bestScore: 0,
  // 累计胜场
  historyScore: 0,
  
  hasPlayPoints: true,
  startTime: undefined,
  endTime: undefined,
  timeArray: [],

  isGameStart() {
    return this.gameState == this.GAME_START;
  },

  setGameStart() {
    this.gameState = this.GAME_START;
    this.recordStart();
    // 开启websocket通讯
    this.initWebsocket();
  },

  isGameStop() {
    return this.gameState == this.GAME_STOP;
  },

  setGameStop() {
    this.gameState = this.GAME_STOP;
    this.recordEnd();
    // 关闭websocket通讯
    this.closeWebsocket();
  },

  reset() {
    this.gameState = this.GAME_INIT; 
    this.gameSpeed = 200;
    this.pipeGens = 0;
    this.score = 0;
    this.count = 0;
    this.timeScale = 1.0;

    this.enemyCount = 0;

    this.startTime = undefined;
    this.endTime = undefined;
    this.timeArray = [];
  },

  recordStart() {
    this.startTime = new Date();
    this.timeArray.push(this.startTime.toLocaleString());
  },

  recordEnd() {
    this.stopTime = new Date();
    this.timeArray.push(this.stopTime.toLocaleString());
  },

  updatePlayTime() {
    this.timeArray.push(new Date().toLocaleString());
  },

  parseParam() {

    // 优先查询 localstorage
    if (this.userInfo != undefined) {
      
      this.uid = this.userInfo.uid;
      this.token = this.userInfo.token;
      this.code = this.userInfo.code;
      return ;
    }

    
    let codeReg = /code=(.*)&(.*)|code=(.*)$/;
    let tokenReg = /token=(.*)&(.*)$|token=(.*)$/;
    let uidReg = /uid=(.*)&(.*)|uid=(.*)$/;

    let codeMatches = window.location.href.match(codeReg);
    let tokenMatches = window.location.href.match(tokenReg);
    let uidMatches = window.location.href.match(uidReg);

    this.uid = uidMatches ? uidMatches[1] || uidMatches[3] : "";
    this.token = tokenMatches ? tokenMatches[1] || tokenMatches[3] : "";
    this.code = codeMatches ? codeMatches[1] || codeMatches[3] : "";

    // 通过URL链接解析
    this.parsed = true;
  },

  shareLink() {
    if (!this.parsed) this.parseParam();
    return "https://" + this.host + "/activity_double11?activity_id=" + this.activityId + "&share=1&token=" + this.token + "&code=" +this.code;
  },

  checkPlayPoints(callback) {
    if (this.debug) {
      if (callback != undefined && callback instanceof Function) {
        callback();
      }
      return;
    }

    this.sendRequest("/api/game/userInfo", (result) => {
      // 是否可以继续
      this.hasPlayPoints = result &&
        result.code == 1 &&
        result.data &&
        result.data.remains &&
        result.data.remains > 0;
      
      // 当前连胜
      this.score = result.data.score;
      // 最高连胜
      this.bestScore = result.data.max_score;
      // 累计胜场
      this.historyScore = result.data.total_score;

      if (callback != undefined && callback instanceof Function) {
        callback();
      }
    });
  },

  saveScore(callback) {
    if (this.debug) {
      if (callback != undefined && callback instanceof Function) {
        callback();
      }
      return;
    }

    this.sendRequest("/api/game/scoreSave", (result) => {
      this.hasPlayPoints = result &&
        result.code == 1 &&
        result.data &&
        result.data.remains &&
        result.data.remains > 0;

        if (callback != undefined && callback instanceof Function) {
          callback();
        }
    });
  },

  sendRequest(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://" + this.host + url, true);
    xhr.setRequestHeader("Content-type", "application/json");

    /**
     * 获取数据后的处理程序
     */
    xhr.onload = function () {
      
      if (xhr.status == 200) {
        
        let json = xhr.responseText; 
        result = JSON.parse(json);
        this.sended = !this.sended;

        callback(result);
      } else {
        console.error("error", xhr.responseText);
      }
    };

    if (!this.parsed) this.parseParam();

    let requestData = {
      uid: this.uid,
      activity_id: this.activityId,
      score: this.count,  // 修改为过关数
      token: this.token,
      start_time: this.startTime ? this.startTime.toLocaleString() : undefined,
      end_time: this.endTime ? this.endTime.toLocaleString() : undefined,
      time_array: this.timeArray ? this.timeArray.toString() : undefined,
    };

    let sign = md5("uid=" + this.uid + "&activity_id=" + this.activityId + "&score=" + this.count + "&token=" + this.token + "&w=" + this.count);
    xhr.setRequestHeader("sign", sign);
    xhr.send(JSON.stringify(requestData)); // 发送请求
  },

  initWebsocket() {
    let options = {
      target: this,
      url: 'wss://' + this.host + '/wss', 
      success: function (e, w) {
        this.target.webSocket = w;

        // 监听分数变化发送消息给服务端
        // Object.defineProperty(this.score, "score", {
        //   get: function () {
        //     return this.score;
        //   },

        //   set: function (newValue) {
        //     // score = newValue;

        //     let data = {
        //       uid: this.userInfo.uid,
        //       score: newValue,
        //     };

        //     webSocket.send(JSON.stringify(data));
        //     console.debug(JSON.stringify(data));
        //   },
        // });
        console.log("连接成功", e);
      },
      message: function (e, w) {
        console.debug(e.data);
        
        if (e && e.data && e.data !== "success") {
          let rivalMessage = JSON.parse(e.data);
          this.target.enemyCount = rivalMessage.opponent_client.score;
        }
      },
      error: function (e) {
        console.log("连接失败");
      },
      close: function (e) {
        console.log("断开连接");
      },
    }

    this.webSocket = createSocket(options);
  }, 

  sendWebSocket() {
    let data = {
      uid: this.uid,
      score: this.count,
    };
    this.webSocket.send(JSON.stringify(data));
  },

  closeWebsocket() {
    this.webSocket.close();
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 320,
    zoom: 1
  },
  // pixelArt: true,
  physics: {'default': 'arcade'},
});

game.scene.add('boot', Boot, true, params);
game.scene.add('play', Play, false, params);
