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
  {id:'010',title:'机械重爪龙',habitat:'MANGROVE CHANNEL',habitatCn:'红树林河道',technique:'河道追猎',accent:'mangrove'},
  {id:'011',title:'机械三角龙',habitat:'CYCAD FOREST',habitatCn:'苏铁林缘',technique:'林缘重盾',accent:'fern'},
  {id:'012',title:'机械剑龙',habitat:'SUNSET FERNLAND',habitatCn:'晚霞蕨原',technique:'背剑映霞',accent:'lava'},
  {id:'013',title:'机械甲龙',habitat:'MOSSY VALLEY',habitatCn:'苔岩山谷',technique:'铁甲镇谷',accent:'desert'},
  {id:'014',title:'机械腕龙',habitat:'MISTY CONIFERS',habitatCn:'云雾杉林',technique:'云冠漫步',accent:'mist'},
  {id:'015',title:'机械梁龙',habitat:'SILVER RIVERBANK',habitatCn:'银光河滩',technique:'银尾逐水',accent:'ocean'},
  {id:'016',title:'机械迷惑龙',habitat:'GOLDEN PLAINS',habitatCn:'金色平原',technique:'巨躯踏原',accent:'desert'},
  {id:'017',title:'机械禽龙',habitat:'GINKGO WOODLAND',habitatCn:'银杏林地',technique:'棘指巡林',accent:'rainforest'},
  {id:'018',title:'机械副栉龙',habitat:'ECHO LAKESHORE',habitatCn:'回声湖畔',technique:'长冠回响',accent:'mangrove'},
  {id:'019',title:'机械慈母龙',habitat:'FERN OASIS',habitatCn:'蕨谷绿洲',technique:'绿洲守望',accent:'fern'},
  {id:'020',title:'机械戟龙',habitat:'AMETHYST GROVE',habitatCn:'紫晶林地',technique:'星棘护境',accent:'crystal'}
];

export const getCard = id => catalog.find(card => card.id === id) || catalog[0];
export const configPath = id => id === '001' ? './card-config.json' : `./cards/${id}/card-config.json`;
