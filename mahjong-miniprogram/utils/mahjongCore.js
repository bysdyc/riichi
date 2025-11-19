const {
  tileTypes,
  displayToInternal,
  internalToDisplay,
  allDisplayTiles,
  allInternalTilesForWait,
  terminals,
  honors,
  yaochuuhai,
  allYakuList,
  klassicYakuList
} = require('./constants');

function getTileCounts(tiles) {
  const counts = {};
  tiles.forEach(tile => {
    counts[tile] = (counts[tile] || 0) + 1;
  });
  return counts;
}

function checkKokushi(tiles, winTile) {
  if (tiles.length !== 14) return null;

  const counts = getTileCounts(tiles);

  if (!tiles.every(t => yaochuuhai.includes(t))) return null;
  if (Object.keys(counts).length !== 13) return null;
  if (!Object.values(counts).every(c => c === 1 || c === 2)) return null;
  if (Object.values(counts).filter(c => c === 2).length !== 1) return null;

  const hand13 = [...tiles];
  const winTileIndex = hand13.indexOf(winTile);
  if (winTileIndex > -1) hand13.splice(winTileIndex, 1);

  const counts13 = getTileCounts(hand13);
  const hasPairInHand13 = Object.values(counts13).some(c => c === 2);

  if (!hasPairInHand13 && counts[winTile] === 2) {
    return { yaku: ['国士无双十三面'], han: 26, fu: 0 };
  }
  return { yaku: ['国士无双'], han: 13, fu: 0 };
}

function checkChiitoitsu(tiles, useKlassicYaku = false) {
  if (tiles.length !== 14) return null;
  const counts = getTileCounts(tiles);
  if (Object.values(counts).every(c => c === 2) && Object.keys(counts).length === 7) {
    const handTiles = tiles;
    let han = 2;
    const yaku = ['七对子'];
    
    // 检查古役：大车轮、大竹林、大数邻、大七星
    if (useKlassicYaku) {
      const sortedTiles = [...handTiles].sort();
      // 大车轮：2筒到8筒各两张
      const daisharin = ['2p', '2p', '3p', '3p', '4p', '4p', '5p', '5p', '6p', '6p', '7p', '7p', '8p', '8p'];
      if (JSON.stringify(sortedTiles) === JSON.stringify(daisharin)) {
        return { yaku: ['大车轮'], han: 13, fu: 25 };
      }
      // 大竹林：2索到8索各两张
      const daichikurin = ['2s', '2s', '3s', '3s', '4s', '4s', '5s', '5s', '6s', '6s', '7s', '7s', '8s', '8s'];
      if (JSON.stringify(sortedTiles) === JSON.stringify(daichikurin)) {
        return { yaku: ['大竹林'], han: 13, fu: 25 };
      }
      // 大数邻：2万到8万各两张
      const daisuurin = ['2m', '2m', '3m', '3m', '4m', '4m', '5m', '5m', '6m', '6m', '7m', '7m', '8m', '8m'];
      if (JSON.stringify(sortedTiles) === JSON.stringify(daisuurin)) {
        return { yaku: ['大数邻'], han: 13, fu: 25 };
      }
      // 大七星：字牌七种各两张 - 双倍役满
      const daichisei = ['1z', '1z', '2z', '2z', '3z', '3z', '4z', '4z', '5z', '5z', '6z', '6z', '7z', '7z'];
      if (JSON.stringify(sortedTiles) === JSON.stringify(daichisei)) {
        return { yaku: ['大七星'], han: 26, fu: 25 };
      }
    }
    
    if (handTiles.every(t => yaochuuhai.includes(t))) {
      yaku.push('混老头');
      han += 2;
    }
    if (handTiles.every(t => honors.includes(t))) {
      yaku.push('字一色');
      han += 13;
    }
    return { yaku, han, fu: 25 };
  }
  return null;
}

function findMelds(tileCounts) {
  const counts = { ...tileCounts };
  const tilesStr = JSON.stringify(counts);
  if (tilesStr === '{}') return [[]];

  const results = [];
  const firstTile = Object.keys(counts).sort()[0];
  if (!firstTile) return [[]];

  const count = counts[firstTile];
  const [numStr, suit] = [firstTile[0], firstTile[1]];
  const num = parseInt(numStr, 10);

  if (count >= 3) {
    const nextCounts = { ...counts };
    nextCounts[firstTile] -= 3;
    if (nextCounts[firstTile] === 0) delete nextCounts[firstTile];

    const subMelds = findMelds(nextCounts);
    subMelds.forEach(melds => {
      results.push([{ type: 'pon', tiles: [firstTile, firstTile, firstTile] }, ...melds]);
    });
  }

  if (suit !== 'z' && num <= 7) {
    const t2 = `${num + 1}${suit}`;
    const t3 = `${num + 2}${suit}`;
    if ((counts[t2] || 0) > 0 && (counts[t3] || 0) > 0) {
      const nextCounts = { ...counts };
      nextCounts[firstTile] -= 1;
      nextCounts[t2] -= 1;
      nextCounts[t3] -= 1;
      if (nextCounts[firstTile] === 0) delete nextCounts[firstTile];
      if (nextCounts[t2] === 0) delete nextCounts[t2];
      if (nextCounts[t3] === 0) delete nextCounts[t3];

      const subMelds = findMelds(nextCounts);
      subMelds.forEach(melds => {
        results.push([{ type: 'shuntsu', tiles: [firstTile, t2, t3] }, ...melds]);
      });
    }
  }

  return results;
}

function findStandardCombinations(tiles) {
  const counts = getTileCounts(tiles);
  const pairs = Object.keys(counts).filter(t => counts[t] >= 2);
  const combinations = [];

  pairs.forEach(pairTile => {
    const countsWithoutPair = { ...counts };
    countsWithoutPair[pairTile] -= 2;
    if (countsWithoutPair[pairTile] === 0) delete countsWithoutPair[pairTile];

    const meldCombinations = findMelds(countsWithoutPair);
    meldCombinations.forEach(melds => {
      if (melds.length === 4) {
        combinations.push({ pair: pairTile, melds });
      }
    });
  });

  return combinations;
}

function getYakuhaiTiles(playerWind, roundWind) {
  const tiles = ['5z', '6z', '7z'];
  if (roundWind === 'east') tiles.push('1z');
  if (roundWind === 'south') tiles.push('2z');
  if (playerWind === 'east') tiles.push('1z');
  if (playerWind === 'south') tiles.push('2z');
  if (playerWind === 'west') tiles.push('3z');
  if (playerWind === 'north') tiles.push('4z');
  return [...new Set(tiles)];
}

function calculateYaku(combo, winTile, context = {}) {
  const {
    isTsumo = true,
    isMenzen = true,
    isRiichi = false,
    isIppatsu = false,
    isDoubleRiichi = false,
    isTenhou = false,
    isChiihou = false,
    isRenhou = false,
    isHaitei = false,
    isHoutei = false,
    isRinshan = false,
    isChankan = false,
    playerWind = 'east',
    roundWind = 'east',
    externalMelds = [],
    useKlassicYaku = false
  } = context;

  const yaku = [];
  let han = 0;

  const allTiles = [...combo.melds.flatMap(m => m.tiles), combo.pair, combo.pair];
  const allMelds = combo.melds;
  const allShuntsu = allMelds.filter(m => m.type === 'shuntsu');
  // allPons 包含所有刻子类型的面子（pon 和杠子）
  const allPons = allMelds.filter(m => m.type === 'pon' || m.isKan);
  const pair = combo.pair;

  if (isTenhou) {
    yaku.push('天和');
    han += 13;
  }
  if (isChiihou) {
    yaku.push('地和');
    han += 13;
  }
  if (isRenhou && useKlassicYaku) {
    yaku.push('人和');
    han += 13;
  }

  const windPons = allPons.filter(m => ['1z', '2z', '3z', '4z'].includes(m.tiles[0]));
  if (windPons.length === 4) {
    yaku.push('大四喜');
    han += 26;
  } else if (windPons.length === 3 && ['1z', '2z', '3z', '4z'].includes(pair)) {
    yaku.push('小四喜');
    han += 13;
  }

  const sangenPons = allPons.filter(m => ['5z', '6z', '7z'].includes(m.tiles[0]));
  if (sangenPons.length === 3) {
    yaku.push('大三元');
    han += 13;
  }

  if (allTiles.every(t => honors.includes(t))) {
    yaku.push('字一色');
    han += 13;
  } else if (allTiles.every(t => terminals.includes(t))) {
    yaku.push('清老头');
    han += 13;
  }

  const greenTiles = ['2s', '3s', '4s', '6s', '8s', '6z'];
  if (allTiles.every(t => greenTiles.includes(t))) {
    yaku.push('绿一色');
    han += 13;
  }

  if (isMenzen) {
    const suitCounts = { m: 0, p: 0, s: 0 };
    allTiles.forEach(t => {
      if (['m', 'p', 's'].includes(t[1])) suitCounts[t[1]] += 1;
    });

    ['m', 'p', 's'].forEach(suit => {
      if (suitCounts[suit] === 14) {
        const counts = getTileCounts(allTiles);
        const pattern = [`1${suit}`, `2${suit}`, `3${suit}`, `4${suit}`, `5${suit}`, `6${suit}`, `7${suit}`, `8${suit}`, `9${suit}`];

        if (
          counts[`1${suit}`] >= 3 &&
          counts[`9${suit}`] >= 3 &&
          pattern.slice(1, 8).every(t => counts[t] >= 1)
        ) {
          const hand13 = [...allTiles];
          const winTileIndex = hand13.indexOf(winTile);
          if (winTileIndex > -1) hand13.splice(winTileIndex, 1);

          const counts13 = getTileCounts(hand13);
          if (
            counts13[`1${suit}`] === 3 &&
            counts13[`9${suit}`] === 3 &&
            pattern.slice(1, 8).every(t => counts13[t] === 1)
          ) {
            yaku.push('纯正九莲宝灯');
            han += 26;
          } else {
            yaku.push('九莲宝灯');
            han += 13;
          }
        }
      }
    });
  }

  if (isMenzen && allPons.length === 4) {
    // 四暗刻单骑：和牌是雀头（单骑听牌）
    if (winTile === pair) {
      yaku.push('四暗刻单骑');
      han += 26;
    } 
    // 四暗刻：必须自摸（荣和的话有一个刻子不是暗刻）
    else if (isTsumo) {
      yaku.push('四暗刻');
      han += 13;
    }
    // 注意：荣和且和牌不是雀头时，不成立四暗刻（有一个明刻）
  }

  const kanCount = (externalMelds || []).filter(m => m.type === 'minkan' || m.type === 'ankan').length;
  if (kanCount === 4) {
    yaku.push('四杠子');
    han += 13;
  }

  if (han >= 13) {
    return { yaku, han };
  }

  const suits = new Set(allTiles.map(t => t[1]).filter(s => ['m', 'p', 's'].includes(s)));
  const hasHonor = allTiles.some(t => honors.includes(t));
  if (suits.size === 1 && !hasHonor) {
    yaku.push('清一色');
    han += isMenzen ? 6 : 5;
  }
  if (han >= 13) {
    return { yaku, han };
  }

  if (suits.size === 1 && hasHonor) {
    yaku.push('混一色');
    han += isMenzen ? 3 : 2;
  }
  const isJunchan = allMelds.every(m => m.tiles.some(t => terminals.includes(t))) && terminals.includes(pair);
  if (isJunchan) {
    yaku.push('纯全带幺九');
    han += isMenzen ? 3 : 2;
  }

  // 三暗刻：统计暗刻数量
  let concealedPons = 0;
  
  // 手牌中的刻子
  allPons.forEach(pon => {
    const tile = pon.tiles[0];
    // 自摸：所有手牌刻子都是暗刻
    // 荣和：和牌不是刻子的牌才算暗刻
    if (isTsumo || tile !== winTile) {
      concealedPons += 1;
    }
  });
  
  // 副露中的暗杠也算暗刻
  const ankanCount = (externalMelds || []).filter(m => m.type === 'ankan').length;
  concealedPons += ankanCount;
  
  if (concealedPons === 3) {
    yaku.push('三暗刻');
    han += 2;
  }

  if (allPons.length === 4) {
    yaku.push('对对和');
    han += 2;
  }
  if (allTiles.every(t => yaochuuhai.includes(t))) {
    yaku.push('混老头');
    han += 2;
  }
  if (sangenPons.length === 2 && ['5z', '6z', '7z'].includes(pair)) {
    yaku.push('小三元');
    han += 2;
  }

  const ponNumbers = {};
  allPons.forEach(m => {
    const num = m.tiles[0][0];
    const suit = m.tiles[0][1];
    if (['m', 'p', 's'].includes(suit)) {
      if (!ponNumbers[num]) ponNumbers[num] = new Set();
      ponNumbers[num].add(suit);
    }
  });
  if (Object.values(ponNumbers).some(set => set.size === 3)) {
    yaku.push('三色同刻');
    han += 2;
  }
  
  // 古役：三连刻（三个连续数字的刻子，同花色）
  if (useKlassicYaku) {
    const suitPons = { m: [], p: [], s: [] };
    allPons.forEach(m => {
      const tile = m.tiles[0];
      const num = parseInt(tile[0]);
      const suit = tile[1];
      if (['m', 'p', 's'].includes(suit)) {
        suitPons[suit].push(num);
      }
    });
    Object.values(suitPons).forEach(nums => {
      nums.sort((a, b) => a - b);
      for (let i = 0; i <= nums.length - 3; i++) {
        if (nums[i + 1] === nums[i] + 1 && nums[i + 2] === nums[i] + 2) {
          yaku.push('三连刻');
          han += 2;
          break;
        }
      }
    });
  }

  if (isDoubleRiichi) {
    yaku.push('双立直');
    han += 2;
  }

  const shuntsuStarts = {};
  allShuntsu.forEach(m => {
    const num = m.tiles[0][0];
    const suit = m.tiles[0][1];
    if (!shuntsuStarts[num]) shuntsuStarts[num] = new Set();
    shuntsuStarts[num].add(suit);
  });
  if (Object.values(shuntsuStarts).some(set => set.size === 3)) {
    yaku.push('三色同顺');
    han += isMenzen ? 2 : 1;
  }
  
  // 古役：一色三同顺（同一花色的三组相同顺子）
  if (useKlassicYaku) {
    const shuntsuCount = {};
    allShuntsu.forEach(m => {
      const key = m.tiles.join(',');
      shuntsuCount[key] = (shuntsuCount[key] || 0) + 1;
    });
    if (Object.values(shuntsuCount).some(count => count >= 3)) {
      yaku.push('一色三同顺');
      han += 3;
    }
  }

  // 古役：五门齐（万、筒、索、风、三元都有）
  if (useKlassicYaku) {
    const hasMan = allTiles.some(t => t[1] === 'm');
    const hasPin = allTiles.some(t => t[1] === 'p');
    const hasSou = allTiles.some(t => t[1] === 's');
    const hasWind = allTiles.some(t => ['1z', '2z', '3z', '4z'].includes(t));
    const hasDragon = allTiles.some(t => ['5z', '6z', '7z'].includes(t));
    const categories = [hasMan, hasPin, hasSou, hasWind, hasDragon].filter(Boolean).length;
    if (categories === 5) {
      yaku.push('五门齐');
      han += 2;
    }
  }
  
  const itsuuSuits = {};
  allShuntsu.forEach(m => {
    const num = m.tiles[0][0];
    const suit = m.tiles[0][1];
    if (!itsuuSuits[suit]) itsuuSuits[suit] = new Set();
    itsuuSuits[suit].add(num);
  });
  if (Object.values(itsuuSuits).some(set => set.has('1') && set.has('4') && set.has('7'))) {
    yaku.push('一气通贯');
    han += isMenzen ? 2 : 1;
  }

  const isChanta = !isJunchan &&
    allMelds.every(m => m.tiles.some(t => yaochuuhai.includes(t))) &&
    yaochuuhai.includes(pair);
  if (isChanta) {
    yaku.push('混全带幺九');
    han += isMenzen ? 2 : 1;
  }

  if (isMenzen && isRiichi && !isDoubleRiichi) {
    yaku.push('立直');
    han += 1;
  }
  if (isIppatsu && (isRiichi || isDoubleRiichi)) {
    yaku.push('一发');
    han += 1;
  }

  if (isHaitei && isTsumo) {
    yaku.push('海底捞月');
    han += 1;
    // 古役：一筒摸月（海底自摸且和牌是一筒）- 5番
    if (useKlassicYaku && winTile === '1p') {
      yaku.push('一筒摸月');
      han += 5;
    }
  }
  if (isHoutei && !isTsumo) {
    yaku.push('河底摸鱼');
    han += 1;
    // 古役：九筒捞鱼（河底荣和且和牌是九筒）- 5番
    if (useKlassicYaku && winTile === '9p') {
      yaku.push('九筒捞鱼');
      han += 5;
    }
  }
  if (isRinshan && isTsumo) {
    yaku.push('岭上开花');
    han += 1;
    // 古役：石上三年（岭上开花的延伸）- 役满
    if (useKlassicYaku) {
      yaku.push('石上三年');
      han += 13;
    }
  }
  if (isChankan && !isTsumo) {
    yaku.push('抢杠');
    han += 1;
    // 古役：杠振（抢杠的别称）
    if (useKlassicYaku) {
      yaku.push('杠振');
      han += 1;
    }
  }

  if (isMenzen && isTsumo) {
    yaku.push('门前清自摸和');
    han += 1;
  }

  const yakuhaiTiles = getYakuhaiTiles(playerWind, roundWind);
  allPons.forEach(m => {
    const tile = m.tiles[0];
    if (yakuhaiTiles.includes(tile)) {
      yaku.push(`役牌(${internalToDisplay[tile]})`);
      han += 1;
    }
  });

  const isPinfuShape = allShuntsu.length === 4;
  const isYakuhaiPair = yakuhaiTiles.includes(pair);
  
  // 检查是否两面听（必须是门清且顺子中包含和牌）
  let isRyanmenWait = false;
  if (isPinfuShape) {
    const winShuntsu = allShuntsu.find(m => m.tiles.includes(winTile));
    if (winShuntsu) {
      const sortedTiles = [...winShuntsu.tiles].sort();
      const [t1, t2, t3] = sortedTiles;
      const num1 = parseInt(t1[0], 10);
      
      // 嵌张：和牌是中间的牌
      if (t2 === winTile) {
        isRyanmenWait = false;
      }
      // 边张：123听3 或 789听7
      else if ((num1 === 1 && winTile === t3) || (num1 === 7 && winTile === t1)) {
        isRyanmenWait = false;
      }
      // 两面听：和牌是两端之一，且不是边张
      else {
        isRyanmenWait = true;
      }
    }
  }

  if (isMenzen && isPinfuShape && !isYakuhaiPair && isRyanmenWait) {
    yaku.push('平和');
    han += 1;
  }

  const shuntsuGroups = {};
  allShuntsu.forEach(m => {
    const key = m.tiles.sort().join('');
    shuntsuGroups[key] = (shuntsuGroups[key] || 0) + 1;
  });
  const pairsOfShuntsu = Object.values(shuntsuGroups).filter(c => c >= 2).length;

  if (isMenzen) {
    // 两杯口：有2组各自重复的顺子（例如：123123 + 456456）
    if (pairsOfShuntsu === 2) {
      yaku.push('两杯口');
      han += 3;
    } 
    // 一杯口：有1组重复的顺子
    else if (pairsOfShuntsu === 1) {
      yaku.push('一杯口');
      han += 1;
    }
  }

  if (!allTiles.some(t => yaochuuhai.includes(t))) {
    yaku.push('断幺九');
    han += 1;
  }
  
  // 古役：燕返（听牌形态为两面，且和牌张刚好使两面变为雀头）
  // 简化实现：两面听 + 荣和 + 和牌构成雀头
  if (useKlassicYaku && !isTsumo && isRyanmenWait && pair === winTile + winTile) {
    yaku.push('燕返');
    han += 1;
  }
  
  // 古役：十二落抬（特殊条件：听单骑 + 最后一张牌和牌）- 1番
  // 简化实现：单骑听 + 海底/河底
  if (useKlassicYaku) {
    const isTanki = pair.startsWith(winTile);
    if (isTanki && (isHaitei || isHoutei)) {
      yaku.push('十二落抬');
      han += 1;
    }
  }

  return { yaku, han };
}

function calculateFu(combo, winTile, context = {}) {
  const {
    isTsumo = true,
    isMenzen = true,
    playerWind = 'east',
    roundWind = 'east',
    isPinfu = false,
    externalMelds = []
  } = context;

  if (isPinfu) {
    return isTsumo ? 20 : 30;
  }

  let fu = 20;

  if (isMenzen && !isTsumo) fu += 10;
  if (isTsumo) fu += 2;

  const yakuhaiTiles = getYakuhaiTiles(playerWind, roundWind);
  const pair = combo.pair;

  if (yakuhaiTiles.includes(pair)) {
    fu += 2;
  } else if (['5z', '6z', '7z'].includes(pair)) {
    fu += 2;
  }

  combo.melds.forEach(m => {
    if (m.type !== 'pon') return;
    const tile = m.tiles[0];
    let ponFu = yaochuuhai.includes(tile) ? 4 : 2;

    if (isMenzen) {
      if (isTsumo || tile !== winTile) {
        ponFu *= 2;
      }
    } else {
      if (isTsumo && tile === winTile) {
        ponFu *= 2;
      }
    }
    fu += ponFu;
  });

  const convertedExternal = (externalMelds || []).map(m => {
    return {
      type: m.type,
      tiles: m.tiles.map(tile => displayToInternal[tile])
    };
  });

  convertedExternal.forEach(m => {
    if (!m) return;
    if (m.type === 'pon') {
      const tile = m.tiles[0];
      const ponFu = yaochuuhai.includes(tile) ? 4 : 2;
      fu += ponFu;
    } else if (m.type === 'minkan') {
      const tile = m.tiles[0];
      const kanFu = yaochuuhai.includes(tile) ? 16 : 8;
      fu += kanFu;
    } else if (m.type === 'ankan') {
      const tile = m.tiles[0];
      const kanFu = yaochuuhai.includes(tile) ? 32 : 16;
      fu += kanFu;
    }
  });

  const isTanki = winTile === pair;
  const isPenchan = combo.melds.some(m => {
    if (m.type !== 'shuntsu') return false;
    const sorted = [...m.tiles].sort();
    if (sorted[0][0] === '1' && sorted[2] === winTile) return true;
    if (sorted[2][0] === '9' && sorted[0] === winTile) return true;
    return false;
  });
  const isKanchan = combo.melds.some(m => {
    if (m.type !== 'shuntsu') return false;
    const sorted = [...m.tiles].sort();
    return sorted[1] === winTile;
  });

  if (isTanki || isPenchan || isKanchan) {
    fu += 2;
  }

  return Math.ceil(fu / 10) * 10;
}

function findPartialCombinations(tiles, requiredMeldCount) {
  const counts = getTileCounts(tiles);
  const pairs = Object.keys(counts).filter(t => counts[t] >= 2);
  const combinations = [];

  pairs.forEach(pairTile => {
    const countsWithoutPair = { ...counts };
    countsWithoutPair[pairTile] -= 2;
    if (countsWithoutPair[pairTile] === 0) delete countsWithoutPair[pairTile];

    const meldCombinations = findMelds(countsWithoutPair);
    meldCombinations.forEach(melds => {
      if (melds.length === requiredMeldCount) {
        combinations.push({ pair: pairTile, melds });
      }
    });
  });

  return combinations;
}

function analyzeHandWithMelds(handTiles, winTile, externalMelds, context = {}) {
  const hand14 = [...handTiles, winTile];
  const convertedExternal = (externalMelds || []).map(m => {
    const internalTiles = m.tiles.map(tile => displayToInternal[tile]);
    const meldType = m.type === 'shuntsu' ? 'shuntsu' : 'pon';
    return {
      type: meldType,
      tiles: internalTiles,
      isKan: m.type === 'minkan' || m.type === 'ankan',
      isAnkan: m.type === 'ankan'
    };
  });

  if (!externalMelds || externalMelds.length === 0) {
    return analyzeHandInternal(hand14, winTile, { ...context, externalMelds });
  }

  const requiredMeldCount = Math.max(0, 4 - convertedExternal.length);
  const handCombinations = findPartialCombinations(hand14, requiredMeldCount);

  if (handCombinations.length === 0) {
    return null;
  }

  let bestHand = null;

  handCombinations.forEach(handCombo => {
    const fullCombo = {
      pair: handCombo.pair,
      melds: [...handCombo.melds, ...convertedExternal]
    };

    const yakuResult = calculateYaku(fullCombo, winTile, { ...context, externalMelds });
    if (!yakuResult || yakuResult.han === 0) return;

    const isPinfu = yakuResult.yaku.includes('平和');
    const fu = calculateFu(handCombo, winTile, { ...context, isPinfu, externalMelds });
    const currentHand = { yaku: yakuResult.yaku, han: yakuResult.han, fu };

    if (!bestHand || currentHand.han > bestHand.han || (currentHand.han === bestHand.han && currentHand.fu > bestHand.fu)) {
      bestHand = currentHand;
    }
  });

  return bestHand;
}

function analyzeHandInternal(tiles, winTile, context = {}) {
  if (tiles.length !== 14) return null;

  const kokushi = checkKokushi(tiles, winTile);
  if (kokushi) return kokushi;

  let bestHand = null;

  const chiitoi = checkChiitoitsu(tiles, context.useKlassicYaku);
  if (chiitoi) {
    bestHand = chiitoi;
  }

  const combinations = findStandardCombinations(tiles);
  combinations.forEach(combo => {
    const yakuResult = calculateYaku(combo, winTile, context);
    if (!yakuResult || yakuResult.han === 0) return;

    const isPinfu = yakuResult.yaku.includes('平和');
    const fu = calculateFu(combo, winTile, { ...context, isPinfu });
    const currentHand = { yaku: yakuResult.yaku, han: yakuResult.han, fu };

    if (!bestHand || currentHand.han > bestHand.han || (currentHand.han === bestHand.han && currentHand.fu > bestHand.fu)) {
      bestHand = currentHand;
    }
  });

  return bestHand;
}

function analyzeHand(handTiles, winTile, options = {}) {
  const { externalMelds = [] } = options;
  const internalHand = handTiles.map(tile => displayToInternal[tile]);
  const internalWinTile = displayToInternal[winTile];

  if (!internalWinTile) return null;

  if (!externalMelds || externalMelds.length === 0) {
    return analyzeHandInternal(internalHand.concat(internalWinTile), internalWinTile, {
      ...options,
      externalMelds
    });
  }

  return analyzeHandWithMelds(internalHand, internalWinTile, externalMelds, options);
}

function findTenpaiWaits(hand13, externalMelds = []) {
  const kanCount = externalMelds.filter(m => m.type === 'minkan' || m.type === 'ankan').length;
  const usedTiles = externalMelds.reduce((sum, m) => sum + m.tiles.length, 0);
  const requiredHandCount = (13 + kanCount) - usedTiles;
  if (hand13.length !== requiredHandCount) return [];

  const waits = new Set();
  const requiredMeldCount = Math.max(0, 4 - externalMelds.length);

  allInternalTilesForWait.forEach(tile => {
    const hand14 = [...hand13, tile];
    if (externalMelds.length > 0) {
      const combinations = findPartialCombinations(hand14, requiredMeldCount);
      if (combinations.length > 0) {
        waits.add(internalToDisplay[tile]);
      }
    } else {
      const combinations = findStandardCombinations(hand14);
      if (combinations.length > 0) {
        waits.add(internalToDisplay[tile]);
      }
    }
  });

  if (externalMelds.length === 0) {
    const counts13 = getTileCounts(hand13);
    if (Object.values(counts13).filter(c => c === 2).length === 6) {
      const single = Object.keys(counts13).find(t => counts13[t] === 1);
      if (single) waits.add(internalToDisplay[single]);
    }

    const yaochuuCounts = {};
    let nonYaochuu = false;
    hand13.forEach(t => {
      if (yaochuuhai.includes(t)) {
        yaochuuCounts[t] = (yaochuuCounts[t] || 0) + 1;
      } else {
        nonYaochuu = true;
      }
    });
    if (!nonYaochuu) {
      if (Object.keys(yaochuuCounts).length === 13) {
        yaochuuhai.forEach(t => waits.add(internalToDisplay[t]));
      } else if (
        Object.keys(yaochuuCounts).length === 12 &&
        Object.values(yaochuuCounts).every(c => c === 1)
      ) {
        const missing = yaochuuhai.find(t => !yaochuuCounts[t]);
        if (missing) waits.add(internalToDisplay[missing]);
      }
    }
  }

  return Array.from(waits);
}

function checkYakuConflicts(selectedYakuIds) {
  const conflicts = [];
  const selected = selectedYakuIds
    .map(id => {
      let yaku = allYakuList.find(y => y.id === id);
      if (!yaku) {
        yaku = klassicYakuList.find(y => y.id === id);
      }
      return yaku;
    })
    .filter(Boolean);

  const exclusiveGroups = [
    ['tenhou', 'chiihou', 'renhou'],
    ['riichi', 'double_riichi'],
    ['haitei', 'houtei'],
    ['rinshan', 'chankan'],
    ['iipeikou', 'ryanpeikou'],
    ['chanta', 'junchan'],
    ['honitsu', 'chinitsu'],
    ['kokushi', 'kokushi13'],
    ['suuankou', 'suuankou_tanki'],
    ['chuuren', 'chuuren9']
  ];

  exclusiveGroups.forEach(group => {
    const inGroup = selectedYakuIds.filter(id => group.includes(id));
    if (inGroup.length > 1) {
      const names = inGroup
        .map(id => {
          let yaku = allYakuList.find(y => y.id === id);
          if (!yaku) {
            yaku = klassicYakuList.find(y => y.id === id);
          }
          return yaku?.name;
        })
        .filter(Boolean)
        .join('、');
      conflicts.push(`${names} 不能同时存在`);
    }
  });

  const hasYaku = id => selectedYakuIds.includes(id);

  if (
    (hasYaku('kokushi') || hasYaku('kokushi13')) &&
    selectedYakuIds.some(id => !['kokushi', 'kokushi13', 'tsuuiisou'].includes(id))
  ) {
    conflicts.push('国士无双不能与其他役种复合');
  }

  if (hasYaku('chiitoitsu')) {
    if (hasYaku('toitoi')) conflicts.push('七对子与对对和冲突');
    if (hasYaku('iipeikou') || hasYaku('ryanpeikou')) conflicts.push('七对子与一杯口/两杯口冲突');
    if (hasYaku('sanshoku_doujun') || hasYaku('ittsu')) conflicts.push('七对子与三色同顺/一气通贯冲突');
  }

  if (hasYaku('pinfu') && (hasYaku('toitoi') || hasYaku('chiitoitsu'))) {
    conflicts.push('平和与对对和/七对子冲突');
  }

  if (
    hasYaku('tanyao') &&
    (hasYaku('honroutou') || hasYaku('chinroutou') || hasYaku('chanta') || hasYaku('junchan'))
  ) {
    conflicts.push('断幺九与含幺九牌的役种冲突');
  }

  if (hasYaku('ippatsu') && !hasYaku('riichi') && !hasYaku('double_riichi')) {
    conflicts.push('一发需要立直或双立直');
  }

  return conflicts;
}

function calculateManualHan(manualYakuIds, options = {}) {
  const {
    isManualFuro = false,
    dora = 0,
    uraDora = 0,
    redDora = 0
  } = options;

  const conflicts = checkYakuConflicts(manualYakuIds);
  if (conflicts.length > 0) {
    return { han: 0, conflicts };
  }

  let totalHan = 0;

  manualYakuIds.forEach(yakuId => {
    // 先在标准役种中查找，如果没找到再在古役中查找
    let yaku = allYakuList.find(item => item.id === yakuId);
    if (!yaku) {
      yaku = klassicYakuList.find(item => item.id === yakuId);
    }
    if (!yaku) return;
    if (typeof yaku.hanNaki === 'number' && isManualFuro) {
      totalHan += yaku.hanNaki;
    } else {
      totalHan += yaku.han;
    }
  });

  const hasRiichiYaku = manualYakuIds.includes('riichi') || manualYakuIds.includes('double_riichi');
  totalHan += dora + (hasRiichiYaku ? uraDora : 0) + redDora;

  return { han: totalHan, conflicts: [] };
}

module.exports = {
  tileTypes,
  allDisplayTiles,
  displayToInternal,
  internalToDisplay,
  getTileCounts,
  analyzeHand,
  analyzeHandInternal,
  analyzeHandWithMelds,
  findStandardCombinations,
  findPartialCombinations,
  findTenpaiWaits,
  calculateYaku,
  calculateFu,
  checkYakuConflicts,
  calculateManualHan,
  getYakuhaiTiles
};