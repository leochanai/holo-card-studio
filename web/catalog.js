export const catalog = [
  {id:'001',title:'机械霸王龙',habitat:'TROPICAL RAINFOREST',habitatCn:'热带雨林',technique:'丛林霸主',accent:'rainforest'},
  {id:'002',title:'机械沧龙',habitat:'SUBMARINE VOLCANO',habitatCn:'海底火山',technique:'深渊霸主',accent:'ocean'},
  {id:'003',title:'机械棘龙',habitat:'STORM ESTUARY',habitatCn:'雷暴河口',technique:'潮汐猎手',accent:'storm'},
  {id:'004',title:'机械食肉牛龙',habitat:'LAVA BADLANDS',habitatCn:'熔岩荒原',technique:'熔原狂奔',accent:'lava'},
  {id:'005',title:'机械迅猛龙',habitat:'DESERT RUINS',habitatCn:'沙漠废墟',technique:'沙影疾猎',accent:'desert'},
  {id:'006',title:'机械异特龙',habitat:'FERN CANYON',habitatCn:'巨蕨峡谷',technique:'峡谷伏击',accent:'fern'},
  {id:'007',title:'机械双脊龙',habitat:'MIST WETLANDS',habitatCn:'迷雾湿地',technique:'雾泽回响',accent:'mist'},
  {id:'008',title:'机械南方巨兽龙',habitat:'STORM PLATEAU',habitatCn:'风暴高原',technique:'高原巨影',accent:'storm'},
  {id:'009',title:'机械角鼻龙',habitat:'CRYSTAL CAVERN',habitatCn:'地下水晶洞',technique:'晶窟守望',accent:'crystal'},
  {id:'010',title:'机械重爪龙',habitat:'MANGROVE CHANNEL',habitatCn:'红树林河道',technique:'河道追猎',accent:'mangrove'}
];

export const getCard = id => catalog.find(card => card.id === id) || catalog[0];
export const configPath = id => id === '001' ? './card-config.json' : `./cards/${id}/card-config.json`;
