const params = {
    debug: true,
    hasPlayPoints: true,
    parser: PARSER,

    baseMapWidth: 40,
    mapWidth: 3 * 40,
    mapHeight: 20,
    distance: 0,
    gravity: -800,
    jump: -376,
    pace: 1.6,
    timeCountdown: 120000, // ms
  
    // 通讯参数
    webSocket: undefined,
    host: window.location.host,
  
    userInfo: undefined,
    code: '',
    activityId: '',
    token: '',
    uid: '',
    parsed: false,
    rivalMessage: {},
  
    // 游戏参数
    // 0 初始 1 开始 2 结束
    GAME_INIT: 0,
    GAME_START: 1,
    GAME_STOP: 2,
    gameState: this.GAME_INIT, 
    winner: false,
  
    // 过关数
    count: 0,
    enemyCount: 0,
    // 当前连胜
    score: 0,
    // 最高连胜
    bestScore: 0,
    // 累计胜场
    historyScore: 0,
    
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
      
      this.winner = false;
      this.count = 0;
      this.enemyCount = 0;
      this.winner = false;
      //this.timeScale = 1.0;
  
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
      if (this.userInfo == undefined) {
        this.userInfo = JSON.parse(window.localStorage.getItem("userInfo"));
      }
  
      this.activityId = this.userInfo.activity_id;
      this.uid = this.userInfo.uid;
      this.token = this.userInfo.request_token;
      this.code = JSON.parse(window.localStorage.getItem("wx_code"));
      // 通过URL链接解析
      this.parsed = true;
      return ;
    },
  
    shareLink() {
      if (!this.parsed) this.parseParam();
      return "https://" + this.host + "/activity_double11?activity_id=" + this.activityId + "&share=1&token=" + this.token + "&code=" + this.code;
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
  
    saveScore(callback, callback2) {
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
            callback(callback2);
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
          //console.info("连接成功", e);
        },
        message: function (e, w) {
          //console.debug(e.data);
          
          if (e && e.data && e.data !== "success") {
            let rivalMessage = JSON.parse(e.data);
            this.target.enemyCount = rivalMessage.opponent_client.score;
          }
        },
        error: function (e) {
          //console.error("连接失败");
        },
        close: function (e) {
          //console.info("断开连接");
        },
      }
  
      this.webSocket = createSocket(options);
    }, 
  
    // 发送数据
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