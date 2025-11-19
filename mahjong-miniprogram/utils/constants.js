// 牌面、役种等静态数据定义

const tileTypes = {
  man: ['一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
  pin: ['一筒', '二筒', '三筒', '四筒', '五筒', '六筒', '七筒', '八筒', '九筒'],
  sou: ['一索', '二索', '三索', '四索', '五索', '六索', '七索', '八索', '九索'],
  honor: ['东', '南', '西', '北', '白', '发', '中']
};

const internalTiles = [
  '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
  '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
  '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
  '1z', '2z', '3z', '4z', '5z', '6z', '7z'
];

const displayToInternal = {
  '一万': '1m', '二万': '2m', '三万': '3m', '四万': '4m', '五万': '5m', '六万': '6m', '七万': '7m', '八万': '8m', '九万': '9m',
  '一筒': '1p', '二筒': '2p', '三筒': '3p', '四筒': '4p', '五筒': '5p', '六筒': '6p', '七筒': '7p', '八筒': '8p', '九筒': '9p',
  '一索': '1s', '二索': '2s', '三索': '3s', '四索': '4s', '五索': '5s', '六索': '6s', '七索': '7s', '八索': '8s', '九索': '9s',
  '东': '1z', '南': '2z', '西': '3z', '北': '4z', '白': '5z', '发': '6z', '中': '7z'
};

const internalToDisplay = Object.fromEntries(
  Object.entries(displayToInternal).map(([display, internal]) => [internal, display])
);

const allDisplayTiles = [
  ...tileTypes.man,
  ...tileTypes.pin,
  ...tileTypes.sou,
  ...tileTypes.honor
];

const allInternalTilesForWait = [...internalTiles];

const terminals = ['1m', '9m', '1p', '9p', '1s', '9s'];
const honors = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
const yaochuuhai = [...terminals, ...honors];

const allYakuList = [
  { id: 'kokushi13', name: '国士无双十三面', han: 26, category: 'yakuman' },
  { id: 'kokushi', name: '国士无双', han: 13, category: 'yakuman' },
  { id: 'suuankou_tanki', name: '四暗刻单骑', han: 26, category: 'yakuman' },
  { id: 'suuankou', name: '四暗刻', han: 13, category: 'yakuman' },
  { id: 'daisangen', name: '大三元', han: 13, category: 'yakuman' },
  { id: 'daisuushii', name: '大四喜', han: 26, category: 'yakuman' },
  { id: 'shousuushii', name: '小四喜', han: 13, category: 'yakuman' },
  { id: 'tsuuiisou', name: '字一色', han: 13, category: 'yakuman' },
  { id: 'chinroutou', name: '清老头', han: 13, category: 'yakuman' },
  { id: 'ryuuiisou', name: '绿一色', han: 13, category: 'yakuman' },
  { id: 'chuuren9', name: '纯正九莲宝灯', han: 26, category: 'yakuman' },
  { id: 'chuuren', name: '九莲宝灯', han: 13, category: 'yakuman' },
  { id: 'suukantsu', name: '四杠子', han: 13, category: 'yakuman' },
  { id: 'tenhou', name: '天和', han: 13, category: 'yakuman' },
  { id: 'chiihou', name: '地和', han: 13, category: 'yakuman' },
  { id: 'nagashimangan', name: '流局满贯', han: 5, category: '5han' },
  { id: 'chinitsu', name: '清一色', han: 6, hanNaki: 5, category: '6han' },
  { id: 'honitsu', name: '混一色', han: 3, hanNaki: 2, category: '3han' },
  { id: 'junchan', name: '纯全带幺九', han: 3, hanNaki: 2, category: '3han' },
  { id: 'ryanpeikou', name: '两杯口', han: 3, category: '3han' },
  { id: 'chiitoitsu', name: '七对子', han: 2, category: '2han' },
  { id: 'toitoi', name: '对对和', han: 2, category: '2han' },
  { id: 'sanankou', name: '三暗刻', han: 2, category: '2han' },
  { id: 'sankantsu', name: '三杠子', han: 2, category: '2han' },
  { id: 'honroutou', name: '混老头', han: 2, category: '2han' },
  { id: 'shousangen', name: '小三元', han: 2, category: '2han' },
  { id: 'sanshoku_doujun', name: '三色同顺', han: 2, hanNaki: 1, category: '2han' },
  { id: 'sanshoku_doukou', name: '三色同刻', han: 2, category: '2han' },
  { id: 'ittsu', name: '一气通贯', han: 2, hanNaki: 1, category: '2han' },
  { id: 'chanta', name: '混全带幺九', han: 2, hanNaki: 1, category: '2han' },
  { id: 'double_riichi', name: '双立直', han: 2, category: '2han' },
  { id: 'riichi', name: '立直', han: 1, category: '1han' },
  { id: 'ippatsu', name: '一发', han: 1, category: '1han' },
  { id: 'tsumo', name: '门前清自摸和', han: 1, category: '1han' },
  { id: 'yakuhai_haku', name: '役牌(白)', han: 1, category: '1han' },
  { id: 'yakuhai_hatsu', name: '役牌(发)', han: 1, category: '1han' },
  { id: 'yakuhai_chun', name: '役牌(中)', han: 1, category: '1han' },
  { id: 'yakuhai_ton', name: '役牌(东)', han: 1, category: '1han' },
  { id: 'yakuhai_nan', name: '役牌(南)', han: 1, category: '1han' },
  { id: 'yakuhai_shaa', name: '役牌(西)', han: 1, category: '1han' },
  { id: 'yakuhai_pei', name: '役牌(北)', han: 1, category: '1han' },
  { id: 'pinfu', name: '平和', han: 1, category: '1han' },
  { id: 'iipeikou', name: '一杯口', han: 1, category: '1han' },
  { id: 'tanyao', name: '断幺九', han: 1, category: '1han' },
  { id: 'haitei', name: '海底捞月', han: 1, category: '1han' },
  { id: 'houtei', name: '河底摸鱼', han: 1, category: '1han' },
  { id: 'rinshan', name: '岭上开花', han: 1, category: '1han' },
  { id: 'chankan', name: '抢杠', han: 1, category: '1han' }
];

// 古役列表 (仅在开启古役时可用)
const klassicYakuList = [
  // 役满级古役
  { id: 'sekijousannen', name: '石上三年', han: 13, category: 'yakuman' },
  { id: 'daichisei', name: '大七星', han: 26, category: 'yakuman' },
  { id: 'renhou', name: '人和', han: 13, category: 'yakuman' },
  { id: 'daisharin', name: '大车轮', han: 13, category: 'yakuman' },
  { id: 'daichikurin', name: '大竹林', han: 13, category: 'yakuman' },
  { id: 'daisuurin', name: '大数邻', han: 13, category: 'yakuman' },
  
  // 高番古役
  { id: 'ippatsumooyue', name: '一筒摸月', han: 5, category: '5han' },
  { id: 'choupailaoyuu', name: '九筒捞鱼', han: 5, category: '5han' },
  { id: 'isshokusandoujun', name: '一色三同顺', han: 3, category: '3han' },
  { id: 'sanrenkoo', name: '三连刻', han: 2, category: '2han' },
  { id: 'uumenchi', name: '五门齐', han: 2, category: '2han' },
  
  // 1番古役
  { id: 'shiisuupuuta', name: '十二落抬', han: 1, category: '1han' },
  { id: 'kanshindora', name: '杠振', han: 1, category: '1han' },
  { id: 'tsubamegaeshi', name: '燕返', han: 1, category: '1han' }
];

module.exports = {
  tileTypes,
  internalTiles,
  displayToInternal,
  internalToDisplay,
  allDisplayTiles,
  allInternalTilesForWait,
  terminals,
  honors,
  yaochuuhai,
  allYakuList,
  klassicYakuList
};