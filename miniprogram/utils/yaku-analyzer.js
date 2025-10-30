// utils/yaku-analyzer.js - 完整的役种分析引擎

// 牌型常量
const TERMINALS = ['1m', '9m', '1p', '9p', '1s', '9s'];
const HONORS = ['1z', '2z', '3z', '4z', '5z', '6z', '7z'];
const YAOCHUUHAI = [...TERMINALS, ...HONORS];
const GREEN_TILES = ['2s', '3s', '4s', '6s', '8s', '6z']; // 绿一色

// 获取牌计数
const getTileCounts = (tiles) => {
  const counts = {};
  for (const tile of tiles) {
    counts[tile] = (counts[tile] || 0) + 1;
  }
  return counts;
};

// 检查国士无双
const checkKokushi = (tiles, winTile) => {
  if (tiles.length !== 14) return null;
  
  const counts = getTileCounts(tiles);
  
  // 必须只包含幺九牌
  if (!tiles.every(t => YAOCHUUHAI.includes(t))) return null;
  
  // 必须包含所有13种幺九牌
  if (Object.keys(counts).length !== 13) return null;
  
  // 每种牌只能是1张或2张
  if (!Object.values(counts).every(c => c === 1 || c === 2)) return null;
  
  // 必须只有1个对子
  if (Object.values(counts).filter(c => c === 2).length !== 1) return null;
  
  // 检查是否为13面待（和了牌组成对子）
  const hand13 = [...tiles];
  const winTileIndex = hand13.indexOf(winTile);
  if (winTileIndex > -1) hand13.splice(winTileIndex, 1);
  
  const counts13 = getTileCounts(hand13);
  const hasPairInHand13 = Object.values(counts13).some(c => c === 2);
  
  if (!hasPairInHand13 && counts[winTile] === 2) {
    return { yaku: ['国士无双十三面'], han: 26, fu: 0 };
  }
  return { yaku: ['国士无双'], han: 13, fu: 0 };
};

// 检查七对子
const checkChiitoitsu = (tiles) => {
  if (tiles.length !== 14) return null;
  const counts = getTileCounts(tiles);
  
  if (Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7) {
    let han = 2;
    const yaku = ['七对子'];
    
    // 复合役判断
    if (tiles.every(t => YAOCHUUHAI.includes(t))) {
      yaku.push('混老头');
      han += 2;
    }
    if (tiles.every(t => HONORS.includes(t))) {
      yaku.push('字一色');
      han = 13; // 役满
    }
    
    return { yaku, han, fu: 25 };
  }
  return null;
};

// 查找面子组合
const findMelds = (tileCounts) => {
  const tilesStr = JSON.stringify(tileCounts);
  if (tilesStr === '{}') return [[]];
  
  const results = [];
  const firstTile = Object.keys(tileCounts).sort()[0];
  if (!firstTile) return [[]];
  
  const count = tileCounts[firstTile];
  const [num, suit] = [parseInt(firstTile[0]), firstTile[1]];
  
  // 尝试刻子
  if (count >= 3) {
    const nextCounts = { ...tileCounts };
    nextCounts[firstTile] -= 3;
    if (nextCounts[firstTile] === 0) delete nextCounts[firstTile];
    
    const subMelds = findMelds(nextCounts);
    for (const melds of subMelds) {
      results.push([{ type: 'pon', tiles: [firstTile, firstTile, firstTile] }, ...melds]);
    }
  }
  
  // 尝试顺子（字牌不能组顺子）
  if (suit !== 'z' && num <= 7) {
    const t2 = `${num + 1}${suit}`;
    const t3 = `${num + 2}${suit}`;
    if (tileCounts[t2] > 0 && tileCounts[t3] > 0) {
      const nextCounts = { ...tileCounts };
      nextCounts[firstTile] -= 1;
      nextCounts[t2] -= 1;
      nextCounts[t3] -= 1;
      if (nextCounts[firstTile] === 0) delete nextCounts[firstTile];
      if (nextCounts[t2] === 0) delete nextCounts[t2];
      if (nextCounts[t3] === 0) delete nextCounts[t3];
      
      const subMelds = findMelds(nextCounts);
      for (const melds of subMelds) {
        results.push([{ type: 'shuntsu', tiles: [firstTile, t2, t3] }, ...melds]);
      }
    }
  }
  
  return results;
};

// 查找标准牌型组合（4面子+1雀头）
const findStandardCombinations = (tiles) => {
  const counts = getTileCounts(tiles);
  const pairs = Object.keys(counts).filter(t => counts[t] >= 2);
  let combinations = [];
  
  for (const pairTile of pairs) {
    const countsWithoutPair = { ...counts };
    countsWithoutPair[pairTile] -= 2;
    if (countsWithoutPair[pairTile] === 0) delete countsWithoutPair[pairTile];
    
    const meldCombinations = findMelds(countsWithoutPair);
    for (const melds of meldCombinations) {
      if (melds.length === 4) {
        combinations.push({ pair: pairTile, melds: melds });
      }
    }
  }
  
  return combinations;
};

// 获取役牌
const getYakuhaiTiles = (playerWind, roundWind) => {
  const windMap = {
    '東': '1z', '南': '2z', '西': '3z', '北': '4z'
  };
  
  const yakuhai = ['5z', '6z', '7z']; // 白发中
  
  if (playerWind && windMap[playerWind]) {
    yakuhai.push(windMap[playerWind]);
  }
  if (roundWind && windMap[roundWind]) {
    yakuhai.push(windMap[roundWind]);
  }
  
  return [...new Set(yakuhai)];
};

// 计算役种
const calculateYaku = (combo, winTile, context) => {
  const { isTsumo, isRiichi, isIppatsu, isDoubleRiichi, isTenhou, isChiihou, isRenhou,
          isHaitei, isHoutei, isRinshan, isChankan, isMenzen, 
          playerWind, roundWind, melds: externalMelds } = context;
  
  let han = 0;
  const yaku = [];
  
  const allMelds = [...combo.melds, ...(externalMelds || [])];
  const allTiles = [...combo.melds.flatMap(m => m.tiles), combo.pair, combo.pair];
  const allShuntsu = allMelds.filter(m => m.type === 'shuntsu');
  const allPons = allMelds.filter(m => m.type === 'pon');
  
  // 役满判定
  if (isTenhou) { yaku.push('天和'); han += 13; }
  if (isChiihou) { yaku.push('地和'); han += 13; }
  if (isRenhou) { yaku.push('人和'); han += 13; }
  
  // 字一色
  if (allTiles.every(t => HONORS.includes(t))) {
    yaku.push('字一色'); han += 13;
  }
  
  // 清老头
  if (allTiles.every(t => TERMINALS.includes(t))) {
    yaku.push('清老头'); han += 13;
  }
  
  // 绿一色
  if (allTiles.every(t => GREEN_TILES.includes(t))) {
    yaku.push('绿一色'); han += 13;
  }
  
  // 大三元
  if (allPons.filter(m => ['5z', '6z', '7z'].includes(m.tiles[0])).length === 3) {
    yaku.push('大三元'); han += 13;
  }
  
  // 四暗刻
  const ankou = allPons.filter(m => {
    const meld = (externalMelds || []).find(em => 
      em.tiles[0] === m.tiles[0] && em.type === 'pon'
    );
    return !meld || meld.type === 'ankan';
  });
  
  if (ankou.length === 4 && isMenzen) {
    // 判断是否单骑
    const isTanki = combo.pair === winTile;
    if (isTanki) {
      yaku.push('四暗刻单骑'); han += 26;
    } else {
      yaku.push('四暗刻'); han += 13;
    }
  }
  
  // 大四喜/小四喜
  const windPons = allPons.filter(m => ['1z', '2z', '3z', '4z'].includes(m.tiles[0]));
  if (windPons.length === 4) {
    yaku.push('大四喜'); han += 26;
  } else if (windPons.length === 3 && ['1z', '2z', '3z', '4z'].includes(combo.pair)) {
    yaku.push('小四喜'); han += 13;
  }
  
  // 九莲宝灯
  const suits = [...new Set(allTiles.map(t => t[1]))];
  if (suits.length === 1 && suits[0] !== 'z' && isMenzen) {
    const suit = suits[0];
    const pattern = getTileCounts(allTiles);
    const expected = {
      [`1${suit}`]: 3, [`2${suit}`]: 1, [`3${suit}`]: 1, [`4${suit}`]: 1,
      [`5${suit}`]: 1, [`6${suit}`]: 1, [`7${suit}`]: 1, [`8${suit}`]: 1, [`9${suit}`]: 3
    };
    
    let isChuuren = true;
    let extraCount = 0;
    for (let i = 1; i <= 9; i++) {
      const tile = `${i}${suit}`;
      const actual = pattern[tile] || 0;
      const exp = expected[tile];
      if (actual < exp) {
        isChuuren = false;
        break;
      }
      if (actual > exp) extraCount += actual - exp;
    }
    
    if (isChuuren && extraCount === 1) {
      // 纯正九莲宝灯：和的牌使得某张牌从3张变成4张或从1张变成2张
      if ((pattern[winTile] === 4 && (winTile[0] === '1' || winTile[0] === '9')) ||
          (pattern[winTile] === 2 && winTile[0] !== '1' && winTile[0] !== '9')) {
        yaku.push('纯正九莲宝灯'); han += 26;
      } else {
        yaku.push('九莲宝灯'); han += 13;
      }
    }
  }
  
  // 四杠子
  const kanCount = (externalMelds || []).filter(m => m.type === 'minkan' || m.type === 'ankan').length;
  if (kanCount === 4) {
    yaku.push('四杠子'); han += 13;
  }
  
  // 如果已经是役满，直接返回
  if (han >= 13) {
    return { yaku, han };
  }
  
  // 一般役
  // 立直相关
  if (isDoubleRiichi) { yaku.push('双立直'); han += 2; }
  else if (isRiichi) { yaku.push('立直'); han += 1; }
  
  if (isIppatsu) { yaku.push('一发'); han += 1; }
  
  // 自摸
  if (isTsumo && isMenzen) { yaku.push('门前清自摸和'); han += 1; }
  
  // 海底/河底/岭上/抢杠
  if (isHaitei) { yaku.push('海底摸月'); han += 1; }
  if (isHoutei) { yaku.push('河底捞鱼'); han += 1; }
  if (isRinshan) { yaku.push('岭上开花'); han += 1; }
  if (isChankan) { yaku.push('抢杠'); han += 1; }
  
  // 清一色/混一色
  const suitTypes = [...new Set(allTiles.map(t => t[1]).filter(s => s !== 'z'))];
  const hasHonor = allTiles.some(t => HONORS.includes(t));
  
  if (suitTypes.length === 1) {
    if (hasHonor) {
      yaku.push('混一色');
      han += isMenzen ? 3 : 2;
    } else {
      yaku.push('清一色');
      han += isMenzen ? 6 : 5;
    }
  }
  
  // 断幺九
  const isTanyao = allTiles.every(t => !YAOCHUUHAI.includes(t));
  if (isTanyao) {
    yaku.push('断幺九'); han += 1;
  }
  
  // 纯全带幺九/混全带幺九
  const isJunchan = allMelds.every(m => m.tiles.some(t => TERMINALS.includes(t))) && 
                    TERMINALS.includes(combo.pair);
  const isChanta = !isJunchan && 
                   allMelds.every(m => m.tiles.some(t => YAOCHUUHAI.includes(t))) && 
                   YAOCHUUHAI.includes(combo.pair);
  
  if (isJunchan) {
    yaku.push('纯全带幺九');
    han += isMenzen ? 3 : 2;
  } else if (isChanta) {
    yaku.push('混全带幺九');
    han += isMenzen ? 2 : 1;
  }
  
  // 对对和
  if (allShuntsu.length === 0 && allMelds.length === 4) {
    yaku.push('对对和'); han += 2;
  }
  
  // 三暗刻
  if (ankou.length === 3) {
    yaku.push('三暗刻'); han += 2;
  }
  
  // 三杠子
  if (kanCount === 3) {
    yaku.push('三杠子'); han += 2;
  }
  
  // 混老头
  if (allTiles.every(t => YAOCHUUHAI.includes(t)) && allTiles.some(t => TERMINALS.includes(t)) && hasHonor) {
    yaku.push('混老头'); han += 2;
  }
  
  // 小三元
  const sangenPons = allPons.filter(m => ['5z', '6z', '7z'].includes(m.tiles[0]));
  if (sangenPons.length === 2 && ['5z', '6z', '7z'].includes(combo.pair)) {
    yaku.push('小三元'); han += 2;
  }
  
  // 三色同顺
  if (suitTypes.length === 3) {
    const shuntsuPatterns = allShuntsu.map(m => m.tiles[0][0]);
    const patternCounts = {};
    shuntsuPatterns.forEach(p => patternCounts[p] = (patternCounts[p] || 0) + 1);
    if (Object.values(patternCounts).some(c => c === 3)) {
      yaku.push('三色同顺');
      han += isMenzen ? 2 : 1;
    }
  }
  
  // 三色同刻
  if (suitTypes.length === 3) {
    const ponPatterns = allPons.filter(m => m.tiles[0][1] !== 'z').map(m => m.tiles[0][0]);
    const patternCounts = {};
    ponPatterns.forEach(p => patternCounts[p] = (patternCounts[p] || 0) + 1);
    if (Object.values(patternCounts).some(c => c === 3)) {
      yaku.push('三色同刻'); han += 2;
    }
  }
  
  // 一气通贯
  for (const suit of suitTypes) {
    const shuntsuInSuit = allShuntsu.filter(m => m.tiles[0][1] === suit).map(m => m.tiles[0]);
    if (shuntsuInSuit.includes(`1${suit}`) && 
        shuntsuInSuit.includes(`4${suit}`) && 
        shuntsuInSuit.includes(`7${suit}`)) {
      yaku.push('一气通贯');
      han += isMenzen ? 2 : 1;
    }
  }
  
  // 两杯口/一杯口
  if (isMenzen && allShuntsu.length >= 2) {
    const shuntsuGroups = {};
    allShuntsu.forEach(m => {
      const key = m.tiles.join('');
      shuntsuGroups[key] = (shuntsuGroups[key] || 0) + 1;
    });
    
    const pairsOfShuntsu = Object.values(shuntsuGroups).filter(c => c >= 2).length;
    
    if (pairsOfShuntsu === 2) {
      yaku.push('两杯口'); han += 3;
    } else if (pairsOfShuntsu === 1) {
      yaku.push('一杯口'); han += 1;
    }
  }
  
  // 平和
  const yakuhaiTiles = getYakuhaiTiles(playerWind, roundWind);
  const isYakuhaiPair = yakuhaiTiles.includes(combo.pair);
  const isRyanmenWait = allShuntsu.some(m => {
    const [t1, t2, t3] = m.tiles;
    return (t1 === winTile && parseInt(t1[0]) <= 7) || 
           (t3 === winTile && parseInt(t3[0]) >= 3);
  });
  
  if (isMenzen && allShuntsu.length === 4 && !isYakuhaiPair && isRyanmenWait && !isTsumo) {
    yaku.push('平和'); han += 1;
  }
  
  // 役牌
  const yakuhaiPons = allPons.filter(m => yakuhaiTiles.includes(m.tiles[0]));
  yakuhaiPons.forEach(m => {
    const tile = m.tiles[0];
    const name = { '5z': '白', '6z': '发', '7z': '中', 
                   '1z': '东', '2z': '南', '3z': '西', '4z': '北' }[tile];
    yaku.push(`役牌(${name})`);
    han += 1;
  });
  
  return { yaku, han };
};

// 计算符数
const calculateFu = (combo, winTile, context) => {
  const { isTsumo, isMenzen, melds: externalMelds } = context;
  
  // 七对子固定25符
  if (!combo.melds || combo.melds.length === 0) return 25;
  
  let fu = 20; // 基础符
  
  // 副底
  if (!isMenzen && !isTsumo) {
    // 荣和副露：没有额外符
  } else if (isMenzen && !isTsumo) {
    fu += 10; // 门前荣和
  } else if (isTsumo && isMenzen) {
    fu += 2; // 门前自摸
  }
  
  // 雀头符
  const yakuhaiTiles = getYakuhaiTiles(context.playerWind, context.roundWind);
  if (yakuhaiTiles.includes(combo.pair)) {
    fu += 2;
  }
  
  // 面子符
  const allMelds = [...combo.melds, ...(externalMelds || [])];
  allMelds.forEach(m => {
    if (m.type === 'pon') {
      const tile = m.tiles[0];
      const isYaochuu = YAOCHUUHAI.includes(tile);
      const isOpen = (externalMelds || []).some(em => 
        em.tiles[0] === tile && em.type !== 'ankan'
      );
      
      const ponFu = isYaochuu ? 4 : 2;
      fu += isOpen ? ponFu : ponFu * 2;
    } else if (m.type === 'minkan') {
      const tile = m.tiles[0];
      const kanFu = YAOCHUUHAI.includes(tile) ? 16 : 8;
      fu += kanFu;
    } else if (m.type === 'ankan') {
      const tile = m.tiles[0];
      const kanFu = YAOCHUUHAI.includes(tile) ? 32 : 16;
      fu += kanFu;
    }
  });
  
  // 听牌形式
  const isPair = combo.pair === winTile;
  const isKanchan = combo.melds.some(m => 
    m.type === 'shuntsu' && m.tiles[1] === winTile
  );
  const isPenchan = combo.melds.some(m => 
    m.type === 'shuntsu' && 
    ((m.tiles[0] === winTile && m.tiles[0][0] === '7') ||
     (m.tiles[2] === winTile && m.tiles[2][0] === '3'))
  );
  
  if (isPair || isKanchan || isPenchan) {
    fu += 2;
  }
  
  // 自摸
  if (isTsumo && !isMenzen) {
    fu += 2;
  }
  
  // 向上取整到10
  return Math.ceil(fu / 10) * 10;
};

// 分析手牌（主函数）
const analyzeHand = (tiles, winTile, context) => {
  if (tiles.length !== 14) {
    return { error: '手牌必须是14张（包含和牌）' };
  }
  
  // 检查国士无双
  const kokushi = checkKokushi(tiles, winTile);
  if (kokushi) return kokushi;
  
  // 检查七对子
  const chiitoi = checkChiitoitsu(tiles);
  if (chiitoi) return chiitoi;
  
  // 标准牌型
  const combinations = findStandardCombinations(tiles);
  if (combinations.length === 0) {
    return { error: '无法组成有效的和牌牌型' };
  }
  
  let bestHand = null;
  
  for (const combo of combinations) {
    const { yaku, han } = calculateYaku(combo, winTile, context);
    
    if (han === 0) continue; // 没有役
    
    const isPinfu = yaku.includes('平和');
    const fu = calculateFu(combo, winTile, { ...context, isPinfu });
    const currentHand = { yaku, han, fu, combo };
    
    if (!bestHand || currentHand.han > bestHand.han || 
        (currentHand.han === bestHand.han && currentHand.fu > bestHand.fu)) {
      bestHand = currentHand;
    }
  }
  
  if (!bestHand) {
    return { error: '未检测到有效役种（无役）' };
  }
  
  return bestHand;
};

module.exports = {
  analyzeHand,
  getTileCounts,
  YAOCHUUHAI,
  TERMINALS,
  HONORS
};
