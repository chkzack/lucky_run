const PARSER = {
    parsed: 0,
    // 地图元素块配置
    tileMap: new Map(),
    // 地图快配置
    blockMap: new Map(),
    coinMap: new Map(),
    tileType: new Map(),
    selectMap(target) {
        switch(target) {
            case 'tile': 
                return this.tileMap;
            case 'block': 
                return this.blockMap;
            case 'coin': 
                return this.coinMap;
            default:
                console.error('Can not find target');
        }
    },
    send(relativePath, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", relativePath, true);
        xhr.setRequestHeader("Content-type", "text/plain");
    
        /**
         * 获取数据后的处理程序
         */
        xhr.onload = function () {
            if (xhr.status == 200) {        
                let result = xhr.responseText;
                callback(result);
            } else {
                console.error("error", xhr.responseText);
            }
        };

        xhr.send('');
    },
    init() {
       this.send('/csv/tile.csv', this.csv2tileMap.bind(this));
       this.send('/csv/level.csv', this.csv2BlockMap.bind(this));
       this.send('/csv/coin.csv', this.csv2CoinMap.bind(this));
    },
    setMap(map, tileIndex, x, y) {
        if (map === undefined) return;
        // 增加图块坐标点
        let tilePos = map.get(tileIndex);
        if (tilePos == undefined) {
            tilePos = new Array();
            map.set(tileIndex, tilePos);
        }
        if (tilePos instanceof Array) {
            tilePos.push({
                x: parseInt(x),
                y: parseInt(y)
            });
        }
    },
    /**
     * 生成地图
     * @param {*} csvString 
     */
    csv2tileMap(csvString) {
        let rows = csvString.split('\r\n');
        if (this.tileMap == undefined) {
            this.tileMap = new Map();
        }
        
        // 解析头部
        let headers = rows[0].split(",");

        // 解析数据
        for (let i = 1; i<rows.length; i++) {
            let temp = rows[i].split(",");

            // 只解析第1列和第3列
            this.tileMap.set(temp[0], parseInt(temp[2]));
            this.tileType.set(parseInt(temp[2]), temp[3]);
        }
        console.info('TileMap parsed successfully')
        this.parsed++;
    },
    /**
     * 加载关卡信息并解析成具体图块信息
     * @param {*} csvString 
     */
    csv2layerMap(csvString, target) {
        if (this.tileMap == undefined) {
            console.error('tileMap is not parsed correctly!');
        }

        let targetMap = this.selectMap(target);
        let rows = csvString.split("\r\n");

        for (let i = 1; i<rows.length; i++) {
            let temp = rows[i].split(",");
            let level = temp[0];
            let matIndex = temp[1];
            let pos = {
                x: parseInt(temp[2]),
                y: parseInt(20 - temp[3]),
            }

            
            // 获取关卡信息
            let levelConfig = targetMap.get(level);
            if (levelConfig == undefined) {
                levelConfig = new Map();
                targetMap.set(level, levelConfig);
            } 
            // 获取图块信息
            // 转换成图块信息
            let tileIndex = this.tileMap.get(matIndex);

            // 增加图块坐标点
            this.setMap(levelConfig, tileIndex, pos.x, pos.y);

            // 四方砖块
            if (tileIndex == 24) {
                this.setMap(levelConfig, 25, pos.x+1, pos.y);
                this.setMap(levelConfig, 11, pos.x, pos.y-1);
                this.setMap(levelConfig, 12, pos.x+1, pos.y-1);
            }

            // 车站 TODO
        }

        // 图块补充解析处理
        targetMap.forEach((levelConfig, levelIndex) => {
            // 长水管
            if (levelConfig.has(6)) {
                let array1 = levelConfig.get(6);
                let array2 = levelConfig.get(8);

                for (let i=0; i<array1.length; i++) {
                    let pos1 = array1[i];
                    let pos2 = array2[i];
    
                    if (pos1.y == pos2.y) {
                        let tilePos = levelConfig.get(7);
                        if (tilePos == undefined) {
                            tilePos = new Array();
                            levelConfig.set(7, tilePos);
                        }
                        for (let j=pos1.x+1; j<pos2.x; j++) {
                            let pos = {
                                x: parseInt(j),
                                y: parseInt(pos1.y),
                            }
                            tilePos.push(pos);
                        }
                    }
                }
            }
            // 长栅栏
            if (levelConfig.has(0)) {
                let array1 = levelConfig.get(0);
                let array2 = levelConfig.get(2);

                for (let i=0; i<array1.length; i++) {
                    let pos1 = array1[i];
                    let pos2 = array2[i];
    
                    if (pos1.y == pos2.y) {
                        let tilePos = levelConfig.get(1);
                        if (tilePos == undefined) {
                            tilePos = new Array();
                            levelConfig.set(7, tilePos);
                        }
                        for (let j=pos1.x+1; j<pos2.x; j++) {
                            let pos = {
                                x: parseInt(j),
                                y: parseInt(pos1.y),
                            }
                            tilePos.push(pos);
                        }
                    }
                }
            }
        })

        this.parsed++;
    },
    /**
     * 
     * @param {*} csvString 
     */
    csv2BlockMap(csvString) {
        this.csv2layerMap(csvString, 'block');
    },
    /**
     * 
     * @param {*} csvString 
     */
    csv2CoinMap(csvString) {
        this.csv2layerMap(csvString, 'coin');
    },
    /**
     * 在第三格生成对应关卡的数据
     * @param {*} blockId 
     * @param {*} layer 
     * @param {*} blockWidth 
     * @param {*} blockHeight 
     * @returns 
     */
    genLevel(level, staticGroup, genBaseBottom, target, tileX, tileY, blockWidth, blockHeight) {
        if (level == undefined || staticGroup == undefined) {
            console.error('cannot gen block', 'param is undefined!')
            return ;
        }

        if (this.parsed < 3) {
            console.error('cannot gen block', 'initial error!')
        }

        let targetMap = this.selectMap(target);
        if (targetMap == undefined || !(targetMap instanceof Map)) {
            console.error('cannot gen block', 'targetMap is undefined or type error!')
            return ;
        }

        if (tileX == undefined) tileX = 80;
        if (tileY == undefined) tileY = 0;

        // 获取关卡图块
        let block2gen = targetMap.get(level.toString());

        if (block2gen == undefined) {
            return;
        }

        let trapMap = new Map();

        // 再填充障碍物
        block2gen.forEach((tilePos, tileIndex) => {
            for (let i=0; i<tilePos.length; i++) {
                let pos = tilePos[i];

                if (pos.y >= 18) {
                    trapMap.set(pos.x, pos.y);
                }

                // 检测碰撞
                staticGroup.create((pos.x + tileX)*16, (pos.y + tileY)*16, 'tiles', parseInt(tileIndex), true, true)
                            .setOrigin(0, 0).setName(this.tileType.get(tileIndex)).setDepth(50);
            }
        });

        if (genBaseBottom == true) {
            // 底层砖块 40*2
            for (let x=0; x<40; x++) {
                if (trapMap == undefined || trapMap.get(x) == undefined) {
                    staticGroup.create((x + tileX)*16, 16*18, 'tiles', 4, true, true).setName('block').setOrigin(0, 0).setDepth(50);
                    staticGroup.create((x + tileX)*16, 16*19, 'tiles', 4, true, true).setName('block').setOrigin(0, 0).setDepth(50);
                }
            }
        }

    },
    /**
     * 
     * @param {*} level 
     * @param {*} group 
     */
    genBlock(level, group) {
        this.genLevel(level, group, true, 'block', 80, 0, 40, 20);
    },
    /**
     * 生成金币
     * @param {*} level 
     * @param {*} group 
     */
    genCoin(level, group) {
        this.genLevel(level, group, false, 'coin', 80, 0, 40, 20);
    },
    /**
     * 
     * @param {*} level 
     * @param {*} group 
     */
    genAll(level, group) {
        this.genBlock(level, group, true, 'block', 80, 0, 40, 20);
        this.genLevel(level, group, false, 'coin', 80, 0, 40, 20);
    }
}