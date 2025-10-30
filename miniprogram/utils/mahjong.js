// utils/mahjong.js - 麻将计算核心逻辑

// 计算点数
const calculatePoints = (han, fu, isDealer, isTsumo) => {
  let basicPoints;

  // 役满及以上
  if (han >= 13) {
    const yakumanCount = Math.floor(han / 13);
    basicPoints = 8000 * yakumanCount;
  }
  // 累计役满（11-12番）
  else if (han >= 11) {
    basicPoints = 6000;
  }
  // 三倍满（8-10番）
  else if (han >= 8) {
    basicPoints = 4000;
  }
  // 倍满（6-7番）
  else if (han >= 6) {
    basicPoints = 3000;
  }
  // 跳满（5番或4番30符以下）
  else if (han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    basicPoints = 2000;
  }
  // 满贯
  else {
    basicPoints = fu * Math.pow(2, 2 + han);
    if (basicPoints > 2000) basicPoints = 2000;
  }

  let payment = {};

  if (isTsumo) {
    // 自摸
    if (isDealer) {
      // 庄家自摸，每家支付
      const perPlayer = Math.ceil(basicPoints * 2 / 100) * 100;
      payment = {
        winner: perPlayer * 3,
        dealer: 0,
        nonDealer: -perPlayer
      };
    } else {
      // 闲家自摸
      const fromDealer = Math.ceil(basicPoints * 2 / 100) * 100;
      const fromNonDealer = Math.ceil(basicPoints / 100) * 100;
      payment = {
        winner: fromDealer + fromNonDealer * 2,
        dealer: -fromDealer,
        nonDealer: -fromNonDealer
      };
    }
  } else {
    // 荣和
    let total;
    if (isDealer) {
      total = Math.ceil(basicPoints * 6 / 100) * 100;
    } else {
      total = Math.ceil(basicPoints * 4 / 100) * 100;
    }
    payment = {
      winner: total,
      loser: -total
    };
  }

  return payment;
};

// 计算流局听牌罚符
const calculateDrawPayment = (tenpaiedPlayers) => {
  const tenpaiCount = tenpaiedPlayers.filter(p => p).length;
  if (tenpaiCount === 0 || tenpaiCount === 4) {
    // 全员听牌或全员不听牌，不罚分
    return [0, 0, 0, 0];
  }

  const payment = [0, 0, 0, 0];
  const pointPerPlayer = 3000 / tenpaiCount;

  for (let i = 0; i < 4; i++) {
    if (tenpaiedPlayers[i]) {
      payment[i] = pointPerPlayer;
    } else {
      payment[i] = -3000 / (4 - tenpaiCount);
    }
  }

  return payment;
};

// 判断游戏是否应该结束
const checkGameEnd = (gameSettings, gameState, players, currentDealerIndex) => {
  const { type, tobu } = gameSettings;
  const { wind, round } = gameState;

  // 检查是否有人破产（tobu规则）
  if (tobu) {
    const hasBankrupt = players.some(p => p.score < 0);
    if (hasBankrupt) {
      return { ended: true, reason: 'tobu' };
    }
  }

  // 根据游戏类型判断是否结束
  let maxWind = 'east'; // 东风战
  if (type === 'hanchan') {
    maxWind = 'south'; // 半庄战
  } else if (type === 'yonchan') {
    maxWind = 'north'; // 一庄战
  }

  const windOrder = ['east', 'south', 'west', 'north'];
  const currentWindIndex = windOrder.indexOf(wind);
  const maxWindIndex = windOrder.indexOf(maxWind);

  // 如果当前场大于最大场，或者在最大场的最后一局
  if (currentWindIndex > maxWindIndex) {
    return { ended: true, reason: 'normal' };
  }

  if (currentWindIndex === maxWindIndex && round > 4) {
    return { ended: true, reason: 'normal' };
  }

  return { ended: false };
};

// 获取下一个场和局
const getNextRound = (gameState, dealerWon, currentDealerIndex) => {
  const { wind, round, honba, riichiSticks } = gameState;
  const windOrder = ['east', 'south', 'west', 'north'];

  let newWind = wind;
  let newRound = round;
  let newHonba = honba;
  let newDealerIndex = currentDealerIndex;

  if (dealerWon) {
    // 庄家连庄
    newHonba = honba + 1;
  } else {
    // 庄家轮换
    newHonba = 0;
    newDealerIndex = (currentDealerIndex + 1) % 4;

    // 如果回到第一个庄家，进入下一场
    if (newDealerIndex === 0) {
      const currentWindIndex = windOrder.indexOf(wind);
      if (currentWindIndex < windOrder.length - 1) {
        newWind = windOrder[currentWindIndex + 1];
        newRound = 1;
      } else {
        newRound = round + 1; // 超出范围，游戏应该结束
      }
    } else {
      newRound = newDealerIndex + 1;
    }
  }

  return {
    wind: newWind,
    round: newRound,
    honba: newHonba,
    riichiSticks: dealerWon ? riichiSticks : 0, // 庄家连庄保留立直棒，否则清零
    newDealerIndex
  };
};

// 简化的役种列表（用于手动模式）
const yakuList = [
  { id: 'riichi', name: '立直', han: 1 },
  { id: 'ippatsu', name: '一发', han: 1 },
  { id: 'tsumo', name: '门前清自摸和', han: 1 },
  { id: 'tanyao', name: '断幺九', han: 1 },
  { id: 'pinfu', name: '平和', han: 1 },
  { id: 'iipeikou', name: '一杯口', han: 1 },
  { id: 'haitei', name: '海底摸月', han: 1 },
  { id: 'houtei', name: '河底捞鱼', han: 1 },
  { id: 'rinshan', name: '岭上开花', han: 1 },
  { id: 'chankan', name: '抢杠', han: 1 },
  { id: 'double_riichi', name: '双立直', han: 2 },
  { id: 'chiitoitsu', name: '七对子', han: 2 },
  { id: 'chanta', name: '混全带幺九', han: 2, hanNaki: 1 },
  { id: 'ittsu', name: '一气通贯', han: 2, hanNaki: 1 },
  { id: 'sanshoku', name: '三色同顺', han: 2, hanNaki: 1 },
  { id: 'toitoi', name: '对对和', han: 2 },
  { id: 'sanankou', name: '三暗刻', han: 2 },
  { id: 'sankantsu', name: '三杠子', han: 2 },
  { id: 'honitsu', name: '混一色', han: 3, hanNaki: 2 },
  { id: 'junchan', name: '纯全带幺九', han: 3, hanNaki: 2 },
  { id: 'ryanpeikou', name: '两杯口', han: 3 },
  { id: 'chinitsu', name: '清一色', han: 6, hanNaki: 5 },
  // 役满
  { id: 'tenhou', name: '天和', han: 13 },
  { id: 'chiihou', name: '地和', han: 13 },
  { id: 'kokushi', name: '国士无双', han: 13 },
  { id: 'suuankou', name: '四暗刻', han: 13 },
  { id: 'daisangen', name: '大三元', han: 13 },
  { id: 'shousuushii', name: '小四喜', han: 13 },
  { id: 'daisuushii', name: '大四喜', han: 26 },
  { id: 'tsuuiisou', name: '字一色', han: 13 },
  { id: 'ryuuiisou', name: '绿一色', han: 13 },
  { id: 'chinroutou', name: '清老头', han: 13 },
  { id: 'chuuren', name: '九莲宝灯', han: 13 },
  { id: 'suukantsu', name: '四杠子', han: 13 }
];

module.exports = {
  calculatePoints,
  calculateDrawPayment,
  checkGameEnd,
  getNextRound,
  yakuList
};
