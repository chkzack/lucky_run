let heartCheck = {
  timeout: 20000, // ms
  serverTimeoutObj: null,

  reset () {
    clearTimeout(this.serverTimeoutObj);
    return this;
  },

  start (websocket, options) {
    this.serverTimeoutObj = window.setInterval(() => {
      if (websocket.readyState === 1) {
        websocket.send("ping");
      } else {
        console.log("websocket stop", websocket.readyState);
        window.clearTimeout(this.serverTimeoutObj);
        createSocket(options);
      }
    }, this.timeout);
  },
};

/**
 * 创建一个新的websocket对象
 * @param {object} options
 * @return websocket
 */

function createSocket(options) {
  let websocket;

  if (window.WebSocket) {
    if (!websocket) {
      websocket = new WebSocket(options.url);
    }
  } else {
    console.log("not support websocket");
  }

  websocket.onopen = function (e) {
    // heartCheck && heartCheck.start && heartCheck.start(websocket, options); //启动心跳
    window.webSocket = websocket;
    options.success && options.success(e, websocket);
  };

  websocket.onmessage = function (e) {
    options.message && options.message(e);
  };

  websocket.onerror = function (e) {
    options.error && options.error(e);
  };
  
  websocket.onclose = function (e) {
    options.close && options.close(e);
  };

  window.addEventListener("unbeforeload", function () {
    return websocket.close();
  });

  return websocket;
}
