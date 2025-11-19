const STATUS_LABELS = [
  { key: 'isRiichi', label: '立直' },
  { key: 'isDoubleRiichi', label: '二立直' },
  { key: 'isIppatsu', label: '一发' },
  { key: 'isTenhou', label: '天和' },
  { key: 'isChiihou', label: '地和' },
  { key: 'isRenhou', label: '人和' },
  { key: 'isHaitei', label: '海底' },
  { key: 'isHoutei', label: '河底' },
  { key: 'isRinshan', label: '岭上' },
  { key: 'isChankan', label: '抢杠' }
];

const MELD_TYPE_LABEL = {
  shuntsu: '顺子',
  pon: '碰',
  minkan: '明杠',
  ankan: '暗杠'
};

const TYPE_CLASS_MAP = {
  自摸: 'type-chip-tsumo',
  荣和: 'type-chip-ron',
  多人和牌: 'type-chip-multi',
  流局: 'type-chip-draw'
};

function formatTimestamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

function formatNumber(value, fallback = '0') {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value.toLocaleString('zh-CN');
  }
  const num = Number(value);
  if (!Number.isNaN(num)) {
    return num.toLocaleString('zh-CN');
  }
  return fallback;
}

function formatDelta(value) {
  const num = Number(value) || 0;
  if (num === 0) return '0';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${formatNumber(num)}`;
}

function determineTypeClass(type) {
  return TYPE_CLASS_MAP[type] || 'type-chip-default';
}

function buildScoreLabel(round) {
  if (!round || !round.scoreSummary) return '';
  const summary = round.scoreSummary;
  if (round.type === '流局') {
    if (summary.drawType === 'starting') {
      return '起手流局：无点数变动';
    }
    const tenpaiCount = summary.tenpaiCount || 0;
    const notenCount = summary.notenCount || 0;
    const gain = summary.gainPerTenpai || 0;
    const loss = summary.lossPerNoten || 0;
    const tenpaiPart = `听牌 ${tenpaiCount} 人${gain ? `（每人 +${formatNumber(gain)}）` : ''}`;
    const notenPart = `未听 ${notenCount} 人${loss ? `（每人 -${formatNumber(loss)}）` : ''}`;
    const base = `${tenpaiPart} / ${notenPart}`;
    const nagashiPlayers = Array.isArray(summary.nagashiPlayers) ? summary.nagashiPlayers : [];
    if (nagashiPlayers.length) {
      return `${base} / 流满：${nagashiPlayers.join('、')}`;
    }
    return base;
  }
  if (round.type === '多人和牌') {
    const parts = [];
    if (typeof summary.totalGain === 'number') {
      parts.push(`和牌者合计 +${formatNumber(summary.totalGain)}`);
    }
    if (typeof summary.loserLoss === 'number') {
      parts.push(`放铳 -${formatNumber(Math.abs(summary.loserLoss))}`);
    }
    if (summary.bonusPerWinner) {
      parts.push(`立直棒每人 +${formatNumber(summary.bonusPerWinner)}`);
    }
    if (summary.riichiBonus) {
      parts.push(`立直棒总计 +${formatNumber(summary.riichiBonus)}`);
    }
    return parts.join(' / ');
  }
  if (round.type === '自摸') {
    if (summary.each) {
      return `每人 ${formatNumber(summary.each)} 点`;
    }
    if (summary.dealer || summary.nonDealer) {
      return `庄家 ${formatNumber(summary.dealer || 0)} 点 / 闲家 ${formatNumber(summary.nonDealer || 0)} 点`;
    }
  }
  if (round.type === '荣和') {
    return `放铳 ${formatNumber(summary.total || 0)} 点`;
  }
  if (summary.total) {
    const prefix = summary.total > 0 ? '+' : '';
    return `${prefix}${formatNumber(summary.total)} 点`;
  }
  return '';
}

function buildMultiDetails(details = []) {
  return (details || []).map(detail => {
    const name = detail.isDealer ? `${detail.name || '—'}（庄）` : (detail.name || '—');
    const han = detail.han;
    const fu = detail.fu;
    const segments = [];
    if (han != null && han !== '—') {
      segments.push(`${han}番`);
    }
    if (fu && fu !== '—') {
      segments.push(`${fu}符`);
    }
    return {
      name,
      hanFuLabel: segments.join(' '),
      pointsLabel: `+${formatNumber(detail.points || 0)} 点`,
      bonusLabel: detail.bonus ? `立直棒 +${formatNumber(detail.bonus)}` : ''
    };
  });
}

function buildStatusTags(handSnapshot) {
  if (!handSnapshot) return [];
  const tags = [];
  if (handSnapshot.isMenzen) {
    tags.push('门前清');
  } else if (Array.isArray(handSnapshot.melds) && handSnapshot.melds.length) {
    tags.push('副露');
  }
  const flags = handSnapshot.statusFlags || {};
  STATUS_LABELS.forEach(({ key, label }) => {
    if (flags[key]) {
      tags.push(label);
    }
  });
  return tags;
}

function getTileClass(tile = '') {
  if (tile.includes('万')) return 'tile-man';
  if (tile.includes('筒')) return 'tile-pin';
  if (tile.includes('索')) return 'tile-sou';
  return 'tile-honor';
}

function mapHandTiles(tiles = []) {
  return (tiles || []).map(tile => ({
    label: tile,
    className: getTileClass(tile)
  }));
}

function mapMelds(melds = []) {
  return (melds || []).map((meld = {}) => ({
    typeLabel: MELD_TYPE_LABEL[meld.type] || '副露',
    tiles: mapHandTiles(meld.tiles || [])
  }));
}

function buildPlayerRows(snapshots = []) {
  return (snapshots || []).map(snapshot => {
    const delta = snapshot && snapshot.delta ? snapshot.delta : 0;
    let deltaClass = 'delta-neutral';
    if (delta > 0) deltaClass = 'delta-positive';
    if (delta < 0) deltaClass = 'delta-negative';
    return {
      name: snapshot && snapshot.name ? snapshot.name : '',
      deltaLabel: formatDelta(delta),
      deltaClass,
      finalScoreLabel: formatNumber(snapshot && snapshot.finalScore != null ? snapshot.finalScore : 0)
    };
  });
}

function shouldShowHand(round, handSnapshot) {
  if (!handSnapshot) return false;
  if (!round) return false;
  if (round.type !== '自摸' && round.type !== '荣和') {
    return false;
  }
  const hasTiles = Array.isArray(handSnapshot.handTiles) && handSnapshot.handTiles.length > 0;
  const hasWinTile = !!handSnapshot.winTile;
  const hasMelds = Array.isArray(handSnapshot.melds) && handSnapshot.melds.length > 0;
  return hasTiles || hasWinTile || hasMelds;
}

function buildTenpaiLabel(round) {
  if (!round || round.type !== '流局') return '';
  const players = round.tenpaiPlayers || [];
  const nagashiPlayers = round.nagashiPlayers || [];
  const parts = [];
  if (players.length) {
    parts.push(`听牌：${players.join('、')}`);
  } else {
    parts.push('听牌：无');
  }
  if (nagashiPlayers.length) {
    parts.push(`流满：${nagashiPlayers.join('、')}`);
  }
  return parts.join('  ');
}

function buildRiichiLabel(round) {
  if (!round || !Array.isArray(round.riichiPlayers) || !round.riichiPlayers.length) {
    return '';
  }
  return `立直：${round.riichiPlayers.join('、')}`;
}

function buildDrawMainLabel(round) {
  if (!round || round.type !== '流局') return '';
  const drawType = round.scoreSummary && round.scoreSummary.drawType;
  if (drawType === 'starting') {
    return '起手流局';
  }
  return '流局';
}

Component({
  properties: {
    round: {
      type: Object,
      value: null
    }
  },
  data: {
    expanded: false,
    roundLabel: '',
    typeLabel: '',
    typeClass: 'type-chip-default',
    timestamp: '',
    resultMain: '',
    resultSub: '',
    hanFuLabel: '',
    scoreLabel: '',
    riichiLabel: '',
    statusTags: [],
    multiSummary: '',
    multiDetails: [],
    hasDetails: false,
    showHand: false,
    handTiles: [],
    winTile: null,
    melds: [],
    doraCounts: '',
    doraBreakdown: '',
    playerRows: []
  },
  observers: {
    round(round) {
      this.prepareRound(round);
    }
  },
  methods: {
    prepareRound(round) {
      if (!round) {
        this.setData({
          expanded: false,
          roundLabel: '',
          typeLabel: '',
          typeClass: 'type-chip-default',
          timestamp: '',
          resultMain: '',
          resultSub: '',
          hanFuLabel: '',
          scoreLabel: '',
          riichiLabel: '',
          statusTags: [],
          multiSummary: '',
          multiDetails: [],
          hasDetails: false,
          showHand: false,
          handTiles: [],
          winTile: null,
          melds: [],
          doraCounts: '',
          doraBreakdown: '',
          playerRows: []
        });
        return;
      }

      const typeLabel = round.type || '';
      const typeClass = determineTypeClass(typeLabel);
      const timestamp = formatTimestamp(round.createdAt);

      let resultMain = '';
      let resultSub = '';
      let hanFuLabel = '';

      if (typeLabel === '流局') {
        resultMain = buildDrawMainLabel(round) || '流局';
        resultSub = buildTenpaiLabel(round);
      } else if (typeLabel === '多人和牌') {
        resultMain = `和牌：${round.winner || '—'}`;
        resultSub = round.loser ? `放铳：${round.loser}` : '';
      } else {
        const winner = round.winner || '—';
        resultMain = `和牌：${winner}`;
        if (typeLabel === '自摸') {
          resultSub = '自摸';
        } else if (round.loser) {
          resultSub = `放铳：${round.loser}`;
        }
        const han = round.han;
        const fu = round.fu;
        if (han != null && han !== '—') {
          const fuPart = fu != null && fu !== '—' ? ` ${fu}符` : '';
          hanFuLabel = `${han}番${fuPart}`;
        }
      }

    const rawScoreLabel = buildScoreLabel(round);
    const multiSummary = typeLabel === '多人和牌' ? rawScoreLabel : '';
    const scoreLabel = typeLabel === '多人和牌' ? '' : rawScoreLabel;
      const multiDetails = buildMultiDetails(round.multiWinDetails);
      const riichiLabel = buildRiichiLabel(round);

      const handSnapshot = round.handSnapshot || null;
      const showHand = shouldShowHand(round, handSnapshot);
      const handTiles = showHand ? mapHandTiles(handSnapshot.handTiles) : [];
      const winTile = showHand && handSnapshot.winTile ? {
        label: handSnapshot.winTile,
        className: getTileClass(handSnapshot.winTile)
      } : null;
      const melds = showHand ? mapMelds(handSnapshot.melds) : [];
      const statusTags = showHand ? buildStatusTags(handSnapshot) : [];

      let doraCounts = '';
      let doraBreakdown = '';
      if (showHand && handSnapshot.dora) {
        const { dora = 0, uraDora = 0, redDora = 0 } = handSnapshot.dora;
        doraCounts = `宝 ${formatNumber(dora)} / 里 ${formatNumber(uraDora)} / 赤 ${formatNumber(redDora)}`;
      }
      if (showHand && handSnapshot.doraSummary && handSnapshot.doraSummary.breakdown) {
        doraBreakdown = handSnapshot.doraSummary.breakdown;
      }

    const playerRows = buildPlayerRows(round.playerSnapshots);
    const hasDetails = showHand;

      this.setData({
        expanded: false,
        roundLabel: round.roundLabel || '',
        typeLabel,
        typeClass,
        timestamp,
        resultMain,
        resultSub,
        hanFuLabel,
        scoreLabel,
        riichiLabel,
        statusTags,
        multiSummary,
        multiDetails,
        hasDetails,
        showHand,
        handTiles,
        winTile,
        melds,
        doraCounts,
        doraBreakdown,
        playerRows
      });
    },

    onToggle() {
      this.setData({ expanded: !this.data.expanded });
    }
  }
});