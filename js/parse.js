const PARSER = {
    parsed: true,
    tileMap: undefined,
    blocksMap: undefined,
    readCSVFile(obj) {
        let reader = new FileReader();
        reader.readAsText(obj.files[0]);
        reader.onload = function () {
            let data = csvToObject(this.result);
            console.log(data);//data为csv转换后的对象
        }
    },
    csv2tileMap(csvString) {
        let rows = csvString.split("\r\n");
        this.tileMap = new Map();
        
        // 解析头部
        let headers = rows[0].split(",");

        // 解析数据
        for (let i = 1; i<rows.length; i++) {
            let temp = rows[i].split(",");

            // 只解析第1列和第3列
            this.tileMap.set(temp[0], parseInt(temp[2]));
        }
        console.info('TileMap parsed successfully')
    },
    csv2Blocks(csvString) {
        if (this.tileMap == undefined) {
            console.info('transfer tile');
            this.csv2tile();
        }

        let rows = csvString.split("\r\n");
        this.blocksMap = new Map();

        //
        for (let i = 1; i<rows.length; i++) {
            let temp = rows[i].split(",");
            
            let block = this.blocksMap.get(temp[0]);
            if (block == undefined) {
                block = new Map();
                this.blocksMap.set(temp[0], block);
            } 
            // 
            let tileIndex = this.tileMap.get(temp[1]);
            block
        }
    },
    genBlock(blockId, layer) {
        if (blockId == undefined || layer == undefined) {
            console.error('cannot gen block', 'param is undefined!')
            return ;
        }
        // 填充地图块
        let block2gen = this.blocksMap.get(blockId);

        // 先铺底层砖块
        layer.fill()

        // 再填充障碍物

        block2gen.forEach((k,v) => {

            
        })
    }
}