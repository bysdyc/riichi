const storage = require('../../utils/storage');
const scoreUtils = require('../../utils/score');
const mahjongCore = require('../../utils/mahjongCore');
const { allDisplayTiles, allYakuList, klassicYakuList, tileTypes } = require('../../utils/constants');
const { displayToInternal, internalToDisplay } = mahjongCore;

// 动态构建役种列表,根据是否启用古役
function buildYakuGroups(useKlassicYaku = false) {
  const baseYakuList = [...allYakuList];
  
  // 如果启用古役,将古役添加到列表中
  if (useKlassicYaku) {
    klassicYakuList.forEach(klassicYaku => {
      // 检查是否已存在(避免重复)
      if (!baseYakuList.find(y => y.id === klassicYaku.id)) {
        baseYakuList.push(klassicYaku);
      }
    });
  }
  
  const yakumanList = baseYakuList.filter(item => item.category === 'yakuman');
  const doubleYakumanList = yakumanList.filter(item => Number(item.han) >= 26);
  const singleYakumanList = yakumanList.filter(item => Number(item.han) < 26);
  
  return [
    { id: 'doubleYakuman', title: '双倍役满', list: doubleYakumanList },
    { id: 'yakuman', title: '役满', list: singleYakumanList },
    { id: '6han', title: '6番', list: baseYakuList.filter(item => item.category === '6han') },
    { id: '5han', title: '5番', list: baseYakuList.filter(item => item.category === '5han') },
    { id: '3han', title: '3番', list: baseYakuList.filter(item => item.category === '3han') },
    { id: '2han', title: '2番', list: baseYakuList.filter(item => item.category === '2han') },
    { id: '1han', title: '1番', list: baseYakuList.filter(item => item.category === '1han') }
  ];
}

function buildYakuMap(useKlassicYaku = false) {
  const baseYakuList = [...allYakuList];
  if (useKlassicYaku) {
    klassicYakuList.forEach(klassicYaku => {
      if (!baseYakuList.find(y => y.id === klassicYaku.id)) {
        baseYakuList.push(klassicYaku);
      }
    });
  }
  return baseYakuList.reduce((acc, yaku) => {
    acc[yaku.id] = yaku;
    return acc;
  }, {});
}

const MANUAL_YAKU_GROUPS = buildYakuGroups(false); // 默认不启用古役
const MANUAL_YAKU_MAP = buildYakuMap(false);

const MANUAL_FU_PRESETS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const MANUAL_FU_PRESETS_ROW1 = [20, 25, 30, 40, 50, 60];
const MANUAL_FU_PRESETS_ROW2 = [70, 80, 90, 100, 110];
const EXPERT_HAN_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 26, 39, 52];
const EXPERT_FU_PRESETS = MANUAL_FU_PRESETS.slice();

const tileSuitMap = {};
tileTypes.man.forEach(tile => { tileSuitMap[tile] = 'man'; });
tileTypes.pin.forEach(tile => { tileSuitMap[tile] = 'pin'; });
tileTypes.sou.forEach(tile => { tileSuitMap[tile] = 'sou'; });
tileTypes.honor.forEach(tile => { tileSuitMap[tile] = 'honor'; });

const windDisplayMap = {
  east: '东',
  south: '南',
  west: '西',
  north: '北'
};

const roundWindDisplay = {
  east: '东',
  south: '南',
  west: '西',
  north: '北'
};

const displayWindToInternal = {
  '东': 'east',
  '南': 'south',
  '西': 'west',
  '北': 'north'
};

function clonePlayers(players = []) {
  return players.map(p => ({ ...p }));
}

const tileOrderMap = new Map(allDisplayTiles.map((tile, index) => [tile, index]));
const KAN_TYPES = new Set(['minkan', 'ankan']);

const DEFAULT_STATUS = Object.freeze({
  isMenzen: true,
  isRiichi: false,
  isDoubleRiichi: false,
  isIppatsu: false,
  isTenhou: false,
  isChiihou: false,
  isRenhou: false,
  isHaitei: false,
  isHoutei: false,
  isRinshan: false,
  isChankan: false
});

const STATUS_MENZEN_KEYS = ['isRiichi', 'isDoubleRiichi', 'isIppatsu', 'isTenhou', 'isChiihou', 'isRenhou'];
const STATUS_TSUMO_ONLY = ['isTenhou', 'isChiihou', 'isHaitei', 'isRinshan'];
const STATUS_RON_ONLY = ['isRenhou', 'isHoutei', 'isChankan'];
const STATUS_EXCLUSIVE = {
  isTenhou: ['isChiihou', 'isRenhou'],
  isChiihou: ['isTenhou', 'isRenhou'],
  isRenhou: ['isTenhou', 'isChiihou'],
  isHaitei: ['isHoutei'],
  isHoutei: ['isHaitei'],
  isRinshan: ['isChankan'],
  isChankan: ['isRinshan']
};

const STATUS_TOGGLE_CONFIG = {
  isTenhou: { needMenzen: true, forceMode: 'tsumo', name: '天和', desc: '庄家配牌即和' },
  isChiihou: { needMenzen: true, forceMode: 'tsumo', name: '地和', desc: '闲家第一巡自摸和' },
  isRenhou: { needMenzen: true, forceMode: 'ron', name: '人和', desc: '闲家第一巡荣和' },
  isHaitei: { forceMode: 'tsumo', name: '海底捞月', desc: '最后一张自摸和' },
  isHoutei: { forceMode: 'ron', name: '河底摸鱼', desc: '最后一张荣和' },
  isRinshan: { forceMode: 'tsumo', name: '岭上开花', desc: '杠后自摸和' },
  isChankan: { forceMode: 'ron', name: '抢杠', desc: '抢他家明杠和' }
};

const STATUS_INFO = {
  isRiichi: { name: '立直', desc: '门清听牌宣告立直', han: '1番' },
  isDoubleRiichi: { name: '二立直', desc: '首巡立直', han: '2番' },
  isIppatsu: { name: '一发', desc: '立直后一巡内和牌', han: '+1番' },
  isTenhou: { name: '天和', desc: '庄家配牌即和', han: '役满' },
  isChiihou: { name: '地和', desc: '闲家第一巡自摸和', han: '役满' },
  isRenhou: { name: '人和', desc: '闲家第一巡荣和', han: '跳满' },
  isHaitei: { name: '海底捞月', desc: '最后一张自摸和', han: '1番' },
  isHoutei: { name: '河底摸鱼', desc: '最后一张荣和', han: '1番' },
  isRinshan: { name: '岭上开花', desc: '杠后自摸和', han: '1番' },
  isChankan: { name: '抢杠', desc: '抢他家明杠和', han: '1番' }
};

function cloneStatus(overrides = {}) {
  return { ...DEFAULT_STATUS, ...overrides };
}

function createInitialStatus({ isMenzen = true, winnerRiichi = false } = {}) {
  const status = cloneStatus({ isMenzen });
  if (isMenzen && winnerRiichi) {
    status.isRiichi = true;
  }
  return status;
}

function computeDoraSummary(calcMode, status, doraState = {}) {
  const allowUra = calcMode !== 'auto' || status.isRiichi || status.isDoubleRiichi;
  const dora = Number(doraState.dora) || 0;
  const uraDora = allowUra ? Number(doraState.uraDora) || 0 : 0;
  const redDora = Number(doraState.redDora) || 0;
  const bonus = dora + uraDora + redDora;
  const parts = [];
  if (dora) parts.push(`宝牌 +${dora}`);
  if (uraDora) parts.push(`里宝 +${uraDora}`);
  if (redDora) parts.push(`赤宝 +${redDora}`);
  return {
    dora,
    uraDora,
    redDora,
    bonus,
    allowUra,
    breakdown: parts.length ? parts.join('，') : '暂无额外宝牌'
  };
}

function calculateRedDoraMax(usageMap = {}) {
  const getCount = usageMap instanceof Map
    ? tile => usageMap.get(tile) || 0
    : tile => usageMap[tile] || 0;
  const redTiles = ['5m', '5p', '5s'];
  return redTiles.reduce((sum, tile) => sum + (getCount(tile) >= 4 ? 0 : 1), 0);
}

function buildDoraLimits(calcMode, status, usageMap, doraState = {}) {
  const sanitized = {
    dora: Math.max(0, Number(doraState.dora) || 0),
    uraDora: Math.max(0, Number(doraState.uraDora) || 0),
    redDora: Math.max(0, Number(doraState.redDora) || 0)
  };

  const redMax = calculateRedDoraMax(usageMap);
  const uraMax = calcMode === 'auto'
    ? ((status.isRiichi || status.isDoubleRiichi) ? 12 : 0)
    : 12;
  const doraMax = 12;

  if (sanitized.uraDora > uraMax) sanitized.uraDora = uraMax;
  if (sanitized.redDora > redMax) sanitized.redDora = redMax;

  const summary = computeDoraSummary(calcMode, status, sanitized);

  return {
    limits: { dora: doraMax, uraDora: uraMax, redDora: redMax },
    dora: sanitized,
    summary
  };
}

function sortTilesDisplay(tiles = []) {
  return [...tiles].sort((a, b) => {
    const orderA = tileOrderMap.has(a) ? tileOrderMap.get(a) : Number.MAX_SAFE_INTEGER;
    const orderB = tileOrderMap.has(b) ? tileOrderMap.get(b) : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  if (typeof value.toLocaleString === 'function') {
    return value.toLocaleString('zh-CN');
  }
  return `${value}`;
}

function formatSignedDelta(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return '0';
  }
  const prefix = value > 0 ? '+' : '-';
  const formatted = formatNumber(Math.abs(value));
  return `${prefix}${formatted}`;
}

function cloneMelds(melds = []) {
  return melds.map(m => ({ id: m.id, type: m.type, tiles: [...(m.tiles || [])] }));
}

function buildRoundLabel(gameState) {
  if (!gameState) return '';
  const wind = roundWindDisplay[gameState.wind] || '';
  return `${wind}${gameState.round || 1}局 ${gameState.honba || 0}本场`;
}

Page({
  data: {
    loaded: false,
    players: [],
    gameState: null,
    currentDealerIndex: 0,
    roundDisplay: '',
    roundHistory: [],
    isGameOver: false,
    showSingleWinPanel: false,
    singleWinForm: {
      mode: 'tsumo',
      winnerIndex: 0,
      loserIndex: null,
      han: 1,
      fu: 30
    },
  singleWinHandTiles: [],
  singleWinHandTileSuits: [],
  singleWinTileUsage: {},
    singleWinWinTile: null,
    singleWinWinTileSuit: null,
    singleWinTileTarget: 'hand',
    singleWinMelds: [],
    singleWinMaxHandTiles: 13,
    pendingMeldType: '',
    singleWinAnalysis: null,
    singleWinAnalysisError: '',
    singleWinAutoFill: true,
    singleWinStatus: cloneStatus(),
    singleWinDora: { dora: 0, uraDora: 0, redDora: 0 },
    singleWinDoraLimits: { dora: 12, uraDora: 0, redDora: 3 },
    singleWinDoraSummary: computeDoraSummary('auto', cloneStatus(), { dora: 0, uraDora: 0, redDora: 0 }),
    singleWinStatusExpanded: false,
  singleWinCalcMode: 'auto',
  manualYakuGroups: MANUAL_YAKU_GROUPS,
  manualYakuMap: MANUAL_YAKU_MAP,
  manualFuPresets: MANUAL_FU_PRESETS,
  manualFuPresetsRow1: MANUAL_FU_PRESETS_ROW1,
  manualFuPresetsRow2: MANUAL_FU_PRESETS_ROW2,
  expertHanPresets: EXPERT_HAN_PRESETS,
  expertFuPresets: EXPERT_FU_PRESETS,
  singleWinManualYaku: [],
  singleWinManualFu: 40,
  singleWinManualFuro: false,
  singleWinManualHan: 0,
  singleWinManualActiveMap: {},
  singleWinManualConflicts: [],
  singleWinExpertHan: 1,
  singleWinExpertFu: 30,
  singleWinTenpaiWaits: [],
  singleWinTenpaiStatus: '',
  singleWinTenpaiExpanded: false,
  singleWinScorePreview: null,
  singleWinScoreError: '',
  showDrawDialog: false,
  drawType: 'normal',
  drawTenpaiSelection: [],
  drawNagashiPlayers: [],
  drawShowNagashi: false,
  drawScorePreview: null,
  drawScoreError: '',
    showMultiWinPanel: false,
    multiWinWinners: [],
    multiWinLoser: null,
    multiWinHanFu: {},
    multiWinScorePreview: null,
    multiWinScoreError: '',
    showGameOverDialog: false,
    toast: {
      visible: false,
      message: ''
    }
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.gameSettings) {
      const saved = storage.loadGame();
      if (saved) {
        Object.assign(app.globalData, saved);
      } else {
        wx.redirectTo({ url: '/pages/landing/index' });
        return;
      }
    }
    
    // 根据游戏设置更新役种列表
    const useKlassicYaku = app.globalData.gameSettings?.useKlassicYaku || false;
    this.setData({
      manualYakuGroups: buildYakuGroups(useKlassicYaku),
      manualYakuMap: buildYakuMap(useKlassicYaku)
    });
    this.refreshState();
  },

  refreshState() {
    const app = getApp();
    const {
      players = [],
      gameState = null,
      gameSettings = null,
      currentDealerIndex = 0,
      roundHistory = [],
      isGameOver = false
    } = app.globalData;
    const roundDisplay = this.formatRound(gameState);
    const singleWinForm = this.createDefaultSingleWinForm(currentDealerIndex);
    const singleWinDefaults = this.createDefaultSingleWinTiles();
    const defaultHand = sortTilesDisplay(singleWinDefaults.handTiles);
    const defaultUsage = Object.fromEntries(this.buildTileUsageMap({
      handTiles: defaultHand,
      winTile: singleWinDefaults.winTile,
      melds: singleWinDefaults.melds
    }));
    const winnerIndex = Number.isFinite(singleWinForm.winnerIndex) ? singleWinForm.winnerIndex : 0;
    const baseStatus = createInitialStatus({
      isMenzen: this.isCurrentHandMenzen(singleWinDefaults.melds),
      winnerRiichi: !!(players[winnerIndex] && players[winnerIndex].isRiichi)
    });
    const initialDoraPack = buildDoraLimits('auto', baseStatus, defaultUsage, { dora: 0, uraDora: 0, redDora: 0 });
    this.setData({
      players,
      gameState,
      gameSettings,
      currentDealerIndex,
      roundDisplay,
      roundHistory,
      isGameOver,
      singleWinForm,
  singleWinHandTiles: defaultHand,
  singleWinHandTileSuits: this.mapHandTileSuits(defaultHand),
  singleWinTileUsage: defaultUsage,
      singleWinWinTile: singleWinDefaults.winTile,
      singleWinTileTarget: singleWinDefaults.target,
      singleWinMelds: cloneMelds(singleWinDefaults.melds),
      singleWinMaxHandTiles: this.calculateMaxHandTiles(singleWinDefaults.melds),
      pendingMeldType: singleWinDefaults.pendingMeldType,
      singleWinAnalysis: singleWinDefaults.analysis,
      singleWinAnalysisError: singleWinDefaults.analysisError,
      singleWinAutoFill: singleWinDefaults.autoFill,
    singleWinStatus: cloneStatus(baseStatus),
    singleWinDora: { ...initialDoraPack.dora },
    singleWinDoraLimits: { ...initialDoraPack.limits },
    singleWinDoraSummary: { ...initialDoraPack.summary },
    singleWinStatusExpanded: false,
  singleWinCalcMode: 'auto',
  singleWinManualYaku: [],
  singleWinManualActiveMap: {},
  singleWinManualFu: 40,
  singleWinManualFuro: false,
  singleWinManualHan: 0,
  singleWinManualConflicts: [],
  singleWinExpertHan: 1,
  singleWinExpertFu: 30,
  singleWinTenpaiWaits: [],
  singleWinTenpaiStatus: '',
  singleWinTenpaiExpanded: false,
      singleWinScorePreview: null,
      singleWinScoreError: '',
      showDrawDialog: false,
  drawType: 'normal',
  drawTenpaiSelection: [],
  drawNagashiPlayers: [],
  drawShowNagashi: false,
  drawScorePreview: null,
  drawScoreError: '',
      showMultiWinPanel: false,
      multiWinWinners: [],
      multiWinLoser: null,
      multiWinHanFu: {},
      multiWinScorePreview: null,
      multiWinScoreError: '',
      loaded: true
    }, () => {
      this.refreshSingleWinScorePreview();
    });
  },

  formatRound(gameState) {
    if (!gameState) {
      return '';
    }
    const wind = windDisplayMap[gameState.wind] || '';
    return `${wind}${gameState.round || 1}局`;
  },

  onPlayerNameInput(evt) {
    const index = Number(evt.currentTarget.dataset.index);
    const value = evt.detail.value;
    const players = this.data.players.slice();
    if (!players[index]) {
      return;
    }
    players[index] = { ...players[index], name: value };
    this.setData({ players });

    const app = getApp();
    app.globalData.players[index] = { ...app.globalData.players[index], name: value };
    this.persistState();
  },

  onOpenHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },

  onOpenExport() {
    wx.navigateTo({ url: '/pages/export-preview/index' });
  },

  onStartSingleWin() {
    if (!this.ensureGameReady()) return;
    
    // 如果已有数据,直接打开面板,保留现有数据
    if (this.data.singleWinForm) {
      // 但需要同步一次当前和牌者的立直状态
      const winnerIndex = this.data.singleWinForm.winnerIndex;
      const winner = this.data.players[winnerIndex] || {};
      const status = { ...this.data.singleWinStatus };
      const canUseRiichi = status.isMenzen && !!winner.isRiichi;
      let needUpdate = false;
      
      // 同步立直状态
      if (canUseRiichi && !status.isRiichi && !status.isDoubleRiichi) {
        status.isRiichi = true;
        needUpdate = true;
      } else if (!canUseRiichi && (status.isRiichi || status.isDoubleRiichi || status.isIppatsu)) {
        status.isRiichi = false;
        status.isDoubleRiichi = false;
        status.isIppatsu = false;
        needUpdate = true;
      }
      
      this.setData({
        showSingleWinPanel: true
      }, () => {
        if (needUpdate) {
          this.applyStatusUpdate(status);
        }
      });
      return;
    }
    
    // 首次打开或数据为空时,初始化默认数据
    const form = this.createDefaultSingleWinForm(this.data.currentDealerIndex);
    const tileDefaults = this.createDefaultSingleWinTiles();
    const defaultHand = sortTilesDisplay(tileDefaults.handTiles);
    const defaultUsage = Object.fromEntries(this.buildTileUsageMap({
      handTiles: defaultHand,
      winTile: tileDefaults.winTile,
      melds: tileDefaults.melds
    }));
    const winnerIndex = Number.isFinite(form.winnerIndex) ? form.winnerIndex : 0;
    const baseStatus = createInitialStatus({
      isMenzen: this.isCurrentHandMenzen(tileDefaults.melds),
      winnerRiichi: !!(this.data.players[winnerIndex] && this.data.players[winnerIndex].isRiichi)
    });
    const initialDoraPack = buildDoraLimits('auto', baseStatus, defaultUsage, { dora: 0, uraDora: 0, redDora: 0 });
    this.setData({
      showSingleWinPanel: true,
      singleWinForm: form,
  singleWinHandTiles: defaultHand,
  singleWinHandTileSuits: this.mapHandTileSuits(defaultHand),
  singleWinTileUsage: defaultUsage,
      singleWinWinTile: tileDefaults.winTile,
      singleWinTileTarget: tileDefaults.target,
      singleWinMelds: cloneMelds(tileDefaults.melds),
      singleWinMaxHandTiles: this.calculateMaxHandTiles(tileDefaults.melds),
      pendingMeldType: tileDefaults.pendingMeldType,
      singleWinAnalysis: tileDefaults.analysis,
      singleWinAnalysisError: tileDefaults.analysisError,
      singleWinAutoFill: tileDefaults.autoFill,
      singleWinStatus: cloneStatus(baseStatus),
      singleWinDora: { ...initialDoraPack.dora },
      singleWinDoraLimits: { ...initialDoraPack.limits },
      singleWinDoraSummary: { ...initialDoraPack.summary },
      singleWinStatusExpanded: false,
      singleWinCalcMode: 'auto',
      singleWinManualYaku: [],
  singleWinManualActiveMap: {},
      singleWinManualFu: 40,
      singleWinManualFuro: false,
      singleWinManualHan: 0,
      singleWinManualConflicts: [],
      singleWinExpertHan: 1,
      singleWinExpertFu: 30,
  singleWinTenpaiWaits: [],
  singleWinTenpaiStatus: '',
  singleWinTenpaiExpanded: false,
      singleWinScorePreview: null,
      singleWinScoreError: ''
    }, () => {
      this.refreshSingleWinAnalysis();
      this.refreshSingleWinScorePreview();
    });
  },

  onStartMultiWin() {
    if (!this.ensureGameReady()) return;
    
    // 如果已有数据,直接打开面板,保留现有数据
    if (this.data.multiWinWinners && this.data.multiWinWinners.length > 0) {
      this.setData({
        showMultiWinPanel: true
      });
      return;
    }
    
    // 首次打开或数据为空时,初始化默认数据
    this.setData({
      showMultiWinPanel: true,
      multiWinWinners: [],
      multiWinLoser: null,
      multiWinHanFu: {},
      multiWinScorePreview: null,
      multiWinScoreError: ''
    });
  },

  onStartDraw() {
    if (!this.ensureGameReady()) return;
    
    // 获取所有立直玩家的索引
    const players = this.data.players || [];
    const riichiPlayerIndices = players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.isRiichi)
      .map(({ idx }) => idx);
    
    // 如果已有数据,合并立直玩家到听牌列表
    if (this.data.drawType) {
      const currentTenpai = this.data.drawTenpaiSelection || [];
      // 合并当前听牌列表和立直玩家，去重
      const mergedTenpai = [...new Set([...currentTenpai, ...riichiPlayerIndices])];
      
      this.setData({
        showDrawDialog: true,
        drawTenpaiSelection: mergedTenpai
      }, () => {
        this.refreshDrawPreview();
      });
      return;
    }
    
    // 首次打开或数据为空时,初始化默认数据
    // 自动将立直的玩家设置为听牌
    this.setData({
      showDrawDialog: true,
      drawType: 'normal',
      drawTenpaiSelection: riichiPlayerIndices, // 立直玩家自动设为听牌
      drawNagashiPlayers: [],
      drawShowNagashi: false,
      drawScorePreview: null,
      drawScoreError: ''
    }, () => {
      this.refreshDrawPreview();
    });
  },

  noop() {},

  onTileSelect(evt) {
    const { tile } = evt.detail || {};
    if (!tile) return;
    if (this.data.singleWinTileUsage && this.data.singleWinTileUsage[tile] >= 4) {
      this.showToast('同牌最多 4 张');
      return;
    }
    const target = this.data.singleWinTileTarget;
    if (target === 'hand') {
      const requiredCount = this.getRequiredHandTileCount(this.data.singleWinHandTiles, this.data.singleWinMelds);
      if (this.data.singleWinHandTiles.length >= requiredCount) {
        this.showToast(`手牌已达 ${requiredCount} 张`);
        return;
      }
      if (this.countTileUsage(tile) >= 4) {
        this.showToast('同牌最多 4 张');
        return;
      }
      const nextHandRaw = [...this.data.singleWinHandTiles, tile];
      const nextHand = sortTilesDisplay(nextHandRaw);
      const nextUsage = this.recalcTileUsage({ handTiles: nextHand });
      
      // 检查是否已选满手牌
      const willBeFull = nextHand.length >= requiredCount;
      
      this.setData({
        singleWinHandTiles: nextHand,
        singleWinHandTileSuits: this.mapHandTileSuits(nextHand),
        singleWinTileUsage: nextUsage,
        // 如果选满了,自动切换到和牌区
        ...(willBeFull ? { singleWinTileTarget: 'win' } : {})
      }, () => {
        this.refreshDoraLimits({ usageMap: nextUsage });
        this.refreshSingleWinAnalysis({ handTiles: nextHand });
        
        // 如果选满了,显示提示
        if (willBeFull) {
          this.showToast('手牌已选满,请选择和牌');
        }
      });
    } else {
      if (target === 'meld') {
        this.handleMeldTileSelection(tile);
      } else {
        const countInHand = this.countTileUsage(tile, { includeWin: false });
        if (countInHand >= 4) {
          this.showToast('同牌最多 4 张');
          return;
        }
        const nextUsage = this.recalcTileUsage({ winTile: tile });
        this.setData({
          singleWinWinTile: tile,
          singleWinWinTileSuit: tileSuitMap[tile] || 'man',
          singleWinTileUsage: nextUsage
        }, () => {
          this.refreshDoraLimits({ usageMap: nextUsage });
          this.refreshSingleWinAnalysis({ winTile: tile });
        });
      }
    }
  },

  onChangeTileTarget(evt) {
    const { target } = evt.currentTarget.dataset || {};
    if (!target) return;
    const nextData = { singleWinTileTarget: target };
    if (target === 'meld' && !this.data.pendingMeldType) {
      nextData.pendingMeldType = 'shuntsu';
    }
    this.setData(nextData);
  },

  onSelectMeldType(evt) {
    const { type } = evt.currentTarget.dataset || {};
    if (!type) return;
    this.setData({
      pendingMeldType: type,
      singleWinTileTarget: 'meld'
    });
  },

  onRemoveHandTile(evt) {
    const index = Number(evt.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const filtered = this.data.singleWinHandTiles.filter((_, idx) => idx !== index);
    const nextHand = sortTilesDisplay(filtered);
    const nextUsage = this.recalcTileUsage({ handTiles: nextHand });
    this.setData({
      singleWinHandTiles: nextHand,
      singleWinHandTileSuits: this.mapHandTileSuits(nextHand),
      singleWinTileUsage: nextUsage
    }, () => {
      this.refreshDoraLimits({ usageMap: nextUsage });
      this.refreshSingleWinAnalysis({ handTiles: nextHand });
    });
  },

  onClearSingleWinHand() {
    if (!this.data.singleWinHandTiles.length) return;
    const nextHand = [];
    const nextUsage = this.recalcTileUsage({ handTiles: nextHand });
    this.setData({
      singleWinHandTiles: nextHand,
      singleWinHandTileSuits: [],
      singleWinTileUsage: nextUsage
    }, () => {
      this.refreshDoraLimits({ usageMap: nextUsage });
      this.refreshSingleWinAnalysis({ handTiles: nextHand });
    });
  },

  onClearWinTile() {
    if (!this.data.singleWinWinTile) return;
    const nextUsage = this.recalcTileUsage({ winTile: null });
    this.setData({
      singleWinWinTile: null,
      singleWinWinTileSuit: null,
      singleWinTileUsage: nextUsage
    }, () => {
      this.refreshDoraLimits({ usageMap: nextUsage });
      this.refreshSingleWinAnalysis({ winTile: null });
    });
  },

  onMeldRemove(evt) {
    const { id, index } = evt.detail || {};
    const { singleWinMelds } = this.data;
    if (!id && (index === undefined || index === null)) return;
    let nextMelds;
    if (id) {
      nextMelds = singleWinMelds.filter((item) => item.id !== id);
    } else {
      const numericIndex = Number(index);
      if (Number.isNaN(numericIndex)) return;
      nextMelds = singleWinMelds.filter((_, idx) => idx !== numericIndex);
    }
    const nextUsage = this.recalcTileUsage({ melds: nextMelds });
    const maxHandTiles = this.calculateMaxHandTiles(nextMelds);
    this.setData({
      singleWinMelds: nextMelds,
      singleWinTileUsage: nextUsage,
      singleWinMaxHandTiles: maxHandTiles
    }, () => {
      const isMenzen = this.isCurrentHandMenzen(nextMelds);
      if (isMenzen !== this.data.singleWinStatus.isMenzen) {
        const nextStatus = { ...this.data.singleWinStatus, isMenzen };
        if (!isMenzen) {
          STATUS_MENZEN_KEYS.forEach(key => {
            nextStatus[key] = false;
          });
        }
        this.applyStatusUpdate(nextStatus, {
          skipAnalysis: true,
          afterUpdate: () => {
            this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
          }
        });
      } else {
        this.refreshDoraLimits({ usageMap: nextUsage });
        this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
      }
    });
  },

  onClearSingleWinMelds() {
    if (!(this.data.singleWinMelds && this.data.singleWinMelds.length)) return;
    const nextMelds = [];
    const nextUsage = this.recalcTileUsage({ melds: nextMelds });
    const maxHandTiles = this.calculateMaxHandTiles(nextMelds);
    this.setData({
      singleWinMelds: nextMelds,
      singleWinTileUsage: nextUsage,
      singleWinMaxHandTiles: maxHandTiles
    }, () => {
      if (!this.data.singleWinStatus.isMenzen) {
        const nextStatus = { ...this.data.singleWinStatus, isMenzen: true };
        this.applyStatusUpdate(nextStatus, {
          skipAnalysis: true,
          afterUpdate: () => {
            this.refreshDoraLimits({ usageMap: nextUsage });
            this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
          }
        });
      } else {
        this.refreshDoraLimits({ usageMap: nextUsage });
        this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
      }
    });
  },

  onDoraChange(evt) {
    const dataset = (evt && evt.currentTarget && evt.currentTarget.dataset) || {};
    const type = dataset.type;
    const detail = (evt && evt.detail) || {};
    if (!type || detail.value === undefined) return;
    const nextDora = { ...this.data.singleWinDora, [type]: detail.value };
    const pack = buildDoraLimits(
      this.data.singleWinCalcMode,
      this.data.singleWinStatus,
      this.data.singleWinTileUsage,
      nextDora
    );
    this.setData({
      singleWinDora: { ...pack.dora },
      singleWinDoraLimits: { ...pack.limits },
      singleWinDoraSummary: { ...pack.summary }
    }, () => {
      this.refreshAfterStatusChange();
    });
  },

  applyStatusUpdate(nextStatus, options = {}) {
    const { skipAnalysis = false, afterUpdate, calcMode } = options;
    const normalizedStatus = cloneStatus({ ...nextStatus });
    const mode = calcMode || this.data.singleWinCalcMode;
    this.setData({
      singleWinStatus: normalizedStatus
    }, () => {
      this.refreshDoraLimits({ status: normalizedStatus, calcMode: mode });
      if (typeof afterUpdate === 'function') {
        afterUpdate();
      }
      if (!skipAnalysis) {
        this.refreshAfterStatusChange();
      }
    });
  },

  refreshDoraLimits(options = {}) {
    const status = options.status || this.data.singleWinStatus;
    const calcMode = options.calcMode || this.data.singleWinCalcMode;
    const usageMap = options.usageMap || this.data.singleWinTileUsage;
    const doraState = options.doraState || this.data.singleWinDora;
    const pack = buildDoraLimits(calcMode, status, usageMap, doraState);
    const updates = {
      singleWinDoraLimits: { ...pack.limits },
      singleWinDoraSummary: { ...pack.summary }
    };
    if (
      pack.dora.dora !== this.data.singleWinDora.dora ||
      pack.dora.uraDora !== this.data.singleWinDora.uraDora ||
      pack.dora.redDora !== this.data.singleWinDora.redDora
    ) {
      updates.singleWinDora = { ...pack.dora };
    }
    this.setData(updates);
  },

  refreshAfterStatusChange() {
    if (this.data.singleWinCalcMode === 'manual') {
      this.refreshManualResult();
    } else if (this.data.singleWinCalcMode === 'expert') {
      this.refreshExpertResult();
    } else {
      this.refreshSingleWinAnalysis();
    }
  },

  onToggleStatusPanel() {
    this.setData({ singleWinStatusExpanded: !this.data.singleWinStatusExpanded });
  },

  onToggleTenpaiPanel() {
    this.setData({ singleWinTenpaiExpanded: !this.data.singleWinTenpaiExpanded });
  },

  onToggleStatusRiichi() {
    const status = { ...this.data.singleWinStatus };
    const winner = this.data.players[this.data.singleWinForm.winnerIndex] || {};
    if (!status.isMenzen) {
      this.showToast('有明副露时无法立直');
      return;
    }
    if (!winner.isRiichi) {
      this.showToast('和牌者未宣告立直');
      return;
    }
    if (status.isRiichi) {
      status.isRiichi = false;
      status.isIppatsu = false;
    } else {
      status.isRiichi = true;
      status.isDoubleRiichi = false;
    }
    this.applyStatusUpdate(status);
  },

  onToggleStatusDoubleRiichi() {
    const status = { ...this.data.singleWinStatus };
    const winner = this.data.players[this.data.singleWinForm.winnerIndex] || {};
    if (!status.isMenzen) {
      this.showToast('有明副露时无法二立直');
      return;
    }
    if (!winner.isRiichi) {
      this.showToast('和牌者未宣告立直');
      return;
    }
    if (status.isDoubleRiichi) {
      status.isDoubleRiichi = false;
    } else {
      status.isDoubleRiichi = true;
      status.isRiichi = false;
    }
    if (!status.isDoubleRiichi) {
      status.isIppatsu = false;
    }
    this.applyStatusUpdate(status);
  },

  onToggleStatusIppatsu() {
    const status = { ...this.data.singleWinStatus };
    if (!(status.isRiichi || status.isDoubleRiichi)) {
      this.showToast('需要立直或二立直才能计入一发');
      return;
    }
    status.isIppatsu = !status.isIppatsu;
    this.applyStatusUpdate(status);
  },

  onToggleStatusGeneric(evt) {
    const dataset = (evt && evt.currentTarget && evt.currentTarget.dataset) || {};
    const statusKey = dataset.status;
    if (!statusKey || !STATUS_TOGGLE_CONFIG[statusKey]) return;
    const config = STATUS_TOGGLE_CONFIG[statusKey];
    const status = { ...this.data.singleWinStatus };
    const nextForm = { ...this.data.singleWinForm };

    if (config.needMenzen && !status.isMenzen) {
      this.showToast(`${config.name}需门前清才可选择`);
      return;
    }

    const nextValue = !status[statusKey];
    status[statusKey] = nextValue;

    if (nextValue) {
      const exclusives = STATUS_EXCLUSIVE[statusKey] || [];
      exclusives.forEach(key => {
        status[key] = false;
      });
      if (config.forceMode === 'tsumo' && nextForm.mode !== 'tsumo') {
        nextForm.mode = 'tsumo';
        nextForm.loserIndex = null;
        this.showToast(`已自动切换为自摸模式`);
      }
      if (config.forceMode === 'ron' && nextForm.mode !== 'ron') {
        nextForm.mode = 'ron';
        if (nextForm.loserIndex == null || nextForm.loserIndex === nextForm.winnerIndex) {
          nextForm.loserIndex = this.getDefaultLoserIndex(nextForm.winnerIndex);
        }
        this.showToast(`已自动切换为荣和模式`);
      }
    }

    if (nextForm.mode === 'tsumo') {
      STATUS_RON_ONLY.forEach(key => {
        if (key !== statusKey && status[key]) {
          status[key] = false;
        }
      });
    } else if (nextForm.mode === 'ron') {
      STATUS_TSUMO_ONLY.forEach(key => {
        if (key !== statusKey && status[key]) {
          status[key] = false;
        }
      });
    }

    if (config.forceMode) {
      this.setData({ singleWinForm: nextForm }, () => {
        this.applyStatusUpdate(status);
      });
    } else {
      this.applyStatusUpdate(status);
    }
  },

  onCloseMultiWin() {
    // 只关闭弹窗，保留已输入的数据
    this.setData({
      showMultiWinPanel: false
    });
  },

  onMultiWinToggleWinner(evt) {
    const index = evt && evt.detail ? Number(evt.detail.index) : Number(evt.currentTarget && evt.currentTarget.dataset && evt.currentTarget.dataset.index);
    if (!Number.isInteger(index)) return;
    const winners = [...this.data.multiWinWinners];
    const existing = winners.indexOf(index);
    const nextHanFu = { ...this.data.multiWinHanFu };
    let nextLoser = this.data.multiWinLoser;

    if (existing >= 0) {
      winners.splice(existing, 1);
      delete nextHanFu[index];
    } else {
      // 限制最多3个和牌者
      if (winners.length >= 3) {
        this.showToast('最多只能选择3个和牌者');
        return;
      }
      winners.push(index);
      winners.sort((a, b) => a - b);
      if (!nextHanFu[index]) {
        nextHanFu[index] = { han: '', fu: '' };
      }
      if (nextLoser === index) {
        nextLoser = null;
      }
    }

    this.setData({
      multiWinWinners: winners,
      multiWinHanFu: nextHanFu,
      multiWinLoser: nextLoser
    }, () => {
      this.refreshMultiWinScorePreview();
    });
  },

  onMultiWinLoserChange(evt) {
    const detail = evt && evt.detail ? evt.detail : {};
    if (detail.index === null || detail.index === undefined) {
      this.setData({ multiWinLoser: null }, () => {
        this.refreshMultiWinScorePreview();
      });
      return;
    }
    const value = Number(detail.index);
    if (Number.isNaN(value)) return;
    this.setData({ multiWinLoser: value }, () => {
      this.refreshMultiWinScorePreview();
    });
  },

  onMultiWinHanChange(evt) {
    const index = evt && evt.detail ? Number(evt.detail.index) : Number(evt.currentTarget && evt.currentTarget.dataset && evt.currentTarget.dataset.index);
    if (!Number.isInteger(index)) return;
    const rawValue = evt && evt.detail ? evt.detail.value : undefined;
    if (rawValue === undefined) return;
  const nextHanFu = { ...this.data.multiWinHanFu };
  const current = nextHanFu[index] || { han: '', fu: '' };
    let nextHan;
    if (rawValue === '') {
      nextHan = '';
    } else {
      let numeric = Number(rawValue);
      if (!Number.isFinite(numeric)) return;
      numeric = Math.floor(numeric);
      if (numeric <= 0) {
        numeric = 1;
      }
      nextHan = Math.min(99, numeric);
    }
    nextHanFu[index] = { ...current, han: nextHan };
    this.setData({ multiWinHanFu: nextHanFu }, () => {
      this.refreshMultiWinScorePreview();
    });
  },

  onMultiWinFuChange(evt) {
    const index = evt && evt.detail ? Number(evt.detail.index) : Number(evt.currentTarget && evt.currentTarget.dataset && evt.currentTarget.dataset.index);
    if (!Number.isInteger(index)) return;
    const rawValue = evt && evt.detail ? evt.detail.value : undefined;
    if (rawValue === undefined) return;
  const nextHanFu = { ...this.data.multiWinHanFu };
  const current = nextHanFu[index] || { han: '', fu: '' };
    let nextFu;
    if (rawValue === '') {
      nextFu = '';
    } else {
      let numeric = Number(rawValue);
      if (!Number.isFinite(numeric)) return;
      numeric = Math.floor(numeric);
      if (numeric < 0) {
        numeric = 0;
      }
      nextFu = numeric;
    }
    nextHanFu[index] = { ...current, fu: nextFu };
    this.setData({ multiWinHanFu: nextHanFu }, () => {
      this.refreshMultiWinScorePreview();
    });
  },

  onMultiWinConfirm() {
    if (!this.ensureGameReady()) return;
    const validationError = this.validateMultiWinInputs();
    if (validationError) {
      this.showToast(validationError);
      return;
    }

    const {
      multiWinWinners,
      multiWinLoser,
      multiWinHanFu,
      players,
      gameState,
      currentDealerIndex
    } = this.data;

    const baseChanges = scoreUtils.calculateMultiWinScores({
      playerCount: players.length,
      multiWinners: multiWinWinners,
      multiWinLoser,
      multiWinHanFu,
      currentDealerIndex,
      honba: (gameState && gameState.honba) || 0
    });

    const riichiPlayers = players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.isRiichi)
      .map(({ idx }) => idx);

    const riichiBonus = ((gameState && gameState.riichiSticks) || 0) * 1000;
    const winnersSet = new Set(multiWinWinners);
    const bonusPerWinner = multiWinWinners.length > 0 && riichiBonus > 0
      ? Math.floor(riichiBonus / multiWinWinners.length)
      : 0;

    const changes = baseChanges.map((delta, idx) => {
      let nextDelta = delta || 0;
      if (winnersSet.has(idx)) {
        nextDelta += bonusPerWinner;
      }
      return nextDelta;
    });

    const updatedPlayers = players.map((player, idx) => ({
      ...player,
      score: player.score + (changes[idx] || 0),
      isRiichi: false
    }));

    const roundRecord = this.buildMultiWinHistoryItem({
      winners: multiWinWinners,
      loserIndex: multiWinLoser,
      hanFuMap: multiWinHanFu,
      scoreChanges: changes,
      riichiPlayers,
      bonusPerWinner
    });

    const nextHistory = [...this.data.roundHistory, roundRecord];

    const advanceResult = this.advanceRound({
      players: updatedPlayers,
      gameState: { ...gameState, riichiSticks: 0 },
      dealerIndex: currentDealerIndex,
      dealerContinuation: winnersSet.has(currentDealerIndex)
    });

    const singleWinDefaults = this.createDefaultSingleWinTiles();
    const defaultHand = sortTilesDisplay(singleWinDefaults.handTiles);
    const defaultUsage = Object.fromEntries(this.buildTileUsageMap({
      handTiles: defaultHand,
      winTile: singleWinDefaults.winTile,
      melds: singleWinDefaults.melds
    }));

    this.updateGlobalState({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver
    });

    this.setData({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver,
      roundDisplay: this.formatRound(advanceResult.gameState),
      showMultiWinPanel: false,
      // 清空多人和牌数据
      multiWinWinners: [],
      multiWinLoser: null,
      multiWinHanFu: {},
      multiWinScorePreview: null,
      multiWinScoreError: '',
      // 清空单人和牌数据
      singleWinForm: null,
      singleWinHandTiles: [],
      singleWinHandTileSuits: {},
      singleWinTileUsage: {},
      singleWinWinTile: null,
      singleWinTileTarget: null,
      singleWinMelds: [],
      pendingMeldType: null,
      singleWinAnalysis: null,
      singleWinAnalysisError: null,
      singleWinAutoFill: null,
      singleWinCalcMode: 'auto',
      singleWinManualYaku: [],
      singleWinManualActiveMap: {},
      singleWinManualFu: 40,
      singleWinManualFuro: false,
      singleWinManualHan: 0,
      singleWinManualConflicts: [],
      singleWinExpertHan: 1,
      singleWinExpertFu: 30,
      singleWinTenpaiWaits: [],
      singleWinTenpaiStatus: '',
      singleWinTenpaiExpanded: false,
      singleWinScorePreview: null,
      singleWinScoreError: ''
    });

    this.persistState();
    
    if (advanceResult.isGameOver) {
      this.setData({ showGameOverDialog: true });
    } else {
      this.showToast('多人和牌已记录');
    }
  },

  sanitizePlayerIndices(list = []) {
    const size = (this.data.players || []).length;
    return Array.from(new Set(
      (Array.isArray(list) ? list : [])
        .map(idx => Number(idx))
        .filter(idx => Number.isInteger(idx) && idx >= 0 && idx < size)
    )).sort((a, b) => a - b);
  },

  refreshDrawPreview() {
    const players = clonePlayers(this.data.players || []);
    const playerCount = players.length;
    if (!playerCount) {
      this.setData({
        drawScorePreview: null,
        drawScoreError: '请先添加玩家'
      });
      return;
    }

    const currentDealerIndex = Number.isInteger(this.data.currentDealerIndex)
      ? this.data.currentDealerIndex
      : 0;
    const drawType = this.data.drawType || 'normal';

    if (drawType === 'starting') {
      const playerDeltas = players.map((player, idx) => ({
        playerIndex: idx,
        name: player.name || `玩家${idx + 1}`,
        delta: 0,
        formattedDelta: formatSignedDelta(0),
        isDealer: idx === currentDealerIndex,
        isTenpai: false,
        isNagashi: false,
        addedRiichiStick: false
      }));
      this.setData({
        drawScorePreview: {
          drawType: 'starting',
          summary: '起手流局：本局不结算点棒。',
          detailNotes: [],
          playerDeltas,
          tenpaiCount: 0,
          notenCount: playerCount,
          gainPerTenpai: 0,
          lossPerNoten: 0,
          nagashiCount: 0,
          riichiStickDelta: 0
        },
        drawScoreError: ''
      });
      return;
    }

    const tenpaiList = this.sanitizePlayerIndices(this.data.drawTenpaiSelection);
    const nagashiList = this.sanitizePlayerIndices(this.data.drawNagashiPlayers);
    const tenpaiSet = new Set(tenpaiList);
    const nagashiSet = new Set(nagashiList);
    const drawRiichiList = this.sanitizePlayerIndices(this.data.drawRiichiSelection || [])
      .filter(idx => tenpaiSet.has(idx));
    const drawRiichiSet = new Set(drawRiichiList);

    const deltas = Array(playerCount).fill(0);

    nagashiList.forEach(idx => {
      const isDealer = idx === currentDealerIndex;
      const totalGain = isDealer ? 12000 : 8000;
      const dealerPay = 4000;
      const eachPay = isDealer ? 4000 : 2000;

      deltas[idx] += totalGain;
      players.forEach((_, pIdx) => {
        if (pIdx === idx) return;
        const payment = isDealer ? eachPay : (pIdx === currentDealerIndex ? dealerPay : eachPay);
        deltas[pIdx] -= payment;
      });
    });

    const notenIndices = players.map((_, idx) => idx).filter(idx => !tenpaiSet.has(idx));
    const tenpaiCount = tenpaiSet.size;
    const notenCount = notenIndices.length;
    let gainPerTenpai = 0;
    let lossPerNoten = 0;

    // 有流局满贯时不计未听牌罚符
    const hasNagashi = nagashiList.length > 0;
    if (!hasNagashi && tenpaiCount > 0 && tenpaiCount < playerCount) {
      gainPerTenpai = Math.round(3000 / tenpaiCount);
      lossPerNoten = Math.round(3000 / Math.max(1, notenCount));
      tenpaiSet.forEach(idx => {
        deltas[idx] += gainPerTenpai;
      });
      notenIndices.forEach(idx => {
        deltas[idx] -= lossPerNoten;
      });
    }

    drawRiichiList.forEach(idx => {
      deltas[idx] -= 1000;
    });

    const summarySegments = [];
    if (nagashiList.length) {
      summarySegments.push(`流局满贯 ${nagashiList.length} 人`);
    }
    if (hasNagashi) {
      summarySegments.push('未听牌罚符不计');
    } else if (tenpaiCount === 0 || tenpaiCount === playerCount) {
      summarySegments.push('听牌奖励未触发');
    } else {
      summarySegments.push(`听牌 ${tenpaiCount} 人／未听 ${notenCount} 人`);
    }
    if (drawRiichiList.length) {
      summarySegments.push(`新增立直棒 ${drawRiichiList.length} 支`);
    }
    if (!summarySegments.length) {
      summarySegments.push('本局无点棒变动');
    }

    const detailNotes = [];
    if (!hasNagashi && tenpaiCount > 0 && tenpaiCount < playerCount) {
      detailNotes.push(`听牌玩家每人 ${formatSignedDelta(gainPerTenpai)}，未听玩家每人 ${formatSignedDelta(-lossPerNoten)}。`);
    }
    if (nagashiList.length) {
      detailNotes.push('流局满贯时不计未听牌罚符，也不收本场费。');
    }
    if (drawRiichiList.length) {
      detailNotes.push('新增立直棒：选中玩家立即支付 1000 点。');
    }

    const playerDeltas = players.map((player, idx) => {
      const delta = deltas[idx] || 0;
      return {
        playerIndex: idx,
        name: player.name || `玩家${idx + 1}`,
        delta,
        formattedDelta: formatSignedDelta(delta),
        isDealer: idx === currentDealerIndex,
        isTenpai: tenpaiSet.has(idx),
        isNagashi: nagashiSet.has(idx),
        addedRiichiStick: drawRiichiSet.has(idx)
      };
    });

    const hasScoreChange = deltas.some(delta => delta !== 0);
    if (!hasScoreChange) {
      if ((tenpaiCount === 0 || tenpaiCount === playerCount) && !nagashiList.length && !drawRiichiList.length) {
        detailNotes.unshift('听牌奖励未触发。');
      }
      if (detailNotes.indexOf('所有玩家点数保持不变。') < 0) {
        detailNotes.push('所有玩家点数保持不变。');
      }
    }
    const summaryText = hasScoreChange ? summarySegments.join('；') : '本局无点棒变动';

    this.setData({
      drawScorePreview: {
        drawType: 'normal',
        summary: summaryText,
        detailNotes,
        playerDeltas,
        tenpaiCount,
        notenCount,
        gainPerTenpai,
        lossPerNoten,
        nagashiCount: nagashiList.length,
        riichiStickDelta: drawRiichiList.length
      },
      drawScoreError: ''
    });
  },

  onDrawToggleType(evt) {
    const type = evt && evt.detail ? evt.detail.type : '';
    if (!type || (type !== 'normal' && type !== 'starting')) return;
    if (type === this.data.drawType) return;
    if (type === 'starting') {
      this.setData({
        drawType: type,
        drawTenpaiSelection: [],
        drawNagashiPlayers: [],
        drawShowNagashi: false,
        drawRiichiSelection: []
      }, () => {
        this.refreshDrawPreview();
      });
      return;
    }
    this.setData({ drawType: type }, () => {
      this.refreshDrawPreview();
    });
  },

  onDrawToggleNagashiPanel() {
    if (this.data.drawType !== 'normal') return;
    this.setData({ drawShowNagashi: !this.data.drawShowNagashi });
  },

  onDrawToggleNagashiPlayer(evt) {
    if (this.data.drawType !== 'normal') return;
    const index = Number(evt && evt.detail ? evt.detail.index : NaN);
    if (!Number.isInteger(index)) return;
    const list = Array.isArray(this.data.drawNagashiPlayers)
      ? [...this.data.drawNagashiPlayers]
      : [];
    const existing = list.indexOf(index);
    if (existing >= 0) {
      list.splice(existing, 1);
    } else {
      list.push(index);
    }
    this.setData({ drawNagashiPlayers: this.sanitizePlayerIndices(list) }, () => {
      this.refreshDrawPreview();
    });
  },

  onDrawToggleTenpai(evt) {
    if (this.data.drawType !== 'normal') return;
    const index = Number(evt && evt.detail ? evt.detail.index : NaN);
    if (!Number.isInteger(index)) return;
    
    // 检查该玩家是否立直，立直玩家不能修改听牌状态
    const players = this.data.players || [];
    if (players[index] && players[index].isRiichi) {
      wx.showToast({
        title: '立直玩家必定听牌',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    const list = Array.isArray(this.data.drawTenpaiSelection)
      ? [...this.data.drawTenpaiSelection]
      : [];
    const existing = list.indexOf(index);
    if (existing >= 0) {
      list.splice(existing, 1);
    } else {
      list.push(index);
    }
    const normalized = this.sanitizePlayerIndices(list);
    const riichiSelection = (this.data.drawRiichiSelection || []).filter(idx => normalized.includes(idx));
    this.setData({
      drawTenpaiSelection: normalized,
      drawRiichiSelection: riichiSelection
    }, () => {
      this.refreshDrawPreview();
    });
  },

  onDrawConfirm() {
    if (!this.ensureGameReady()) return;

    const players = clonePlayers(this.data.players);
    const gameState = { ...this.data.gameState };
    const playerCount = players.length;

    const isStartingHandDraw = this.data.drawType === 'starting';

    const tenpaiList = isStartingHandDraw
      ? []
      : this.sanitizePlayerIndices(this.data.drawTenpaiSelection);
    const tenpaiSet = new Set(tenpaiList);
    const nagashiList = !isStartingHandDraw
      ? this.sanitizePlayerIndices(this.data.drawNagashiPlayers)
      : [];
    const nagashiSet = new Set(nagashiList);
    const drawRiichiList = isStartingHandDraw
      ? []
      : this.sanitizePlayerIndices(this.data.drawRiichiSelection).filter(idx => tenpaiSet.has(idx));

  const changes = Array(playerCount).fill(0);
  let gainPerTenpai = 0;
  let lossPerNoten = 0;

    if (!isStartingHandDraw) {
      // Nagashi mangan first
      nagashiList.forEach(idx => {
        const isDealer = idx === this.data.currentDealerIndex;
        const totalGain = isDealer ? 12000 : 8000;
        const dealerPay = 4000;
        const eachPay = isDealer ? 4000 : 2000;

        players.forEach((p, pIdx) => {
          if (pIdx === idx) return;
          const payment = isDealer ? eachPay : (pIdx === this.data.currentDealerIndex ? dealerPay : eachPay);
          p.score -= payment;
          changes[pIdx] -= payment;
        });

        players[idx].score += totalGain;
        changes[idx] += totalGain;

      });

      const notenIndices = players.map((_, idx) => idx).filter(idx => !tenpaiSet.has(idx));
      const tenpaiCount = tenpaiSet.size;
      const notenCount = notenIndices.length;

      // 有流局满贯时不计未听牌罚符
      const hasNagashi = nagashiList.length > 0;
      if (!hasNagashi && tenpaiCount > 0 && tenpaiCount < playerCount) {
        gainPerTenpai = Math.round(3000 / tenpaiCount);
        lossPerNoten = Math.round(3000 / Math.max(1, notenCount));
        tenpaiSet.forEach(idx => {
          players[idx].score += gainPerTenpai;
          changes[idx] += gainPerTenpai;
        });
        notenIndices.forEach(idx => {
          players[idx].score -= lossPerNoten;
          changes[idx] -= lossPerNoten;
        });
      }
    }

    const existingRiichiIndices = players
      .map((p, idx) => (p.isRiichi ? idx : null))
      .filter(idx => idx !== null);
    const allRiichiIndices = Array.from(new Set([...existingRiichiIndices, ...drawRiichiList]));

    drawRiichiList.forEach(idx => {
      if (players[idx]) {
        players[idx].score -= 1000;
        changes[idx] -= 1000;
        gameState.riichiSticks = (gameState.riichiSticks || 0) + 1;
      }
    });
    const dealerContinuation = isStartingHandDraw
      ? true
      : (nagashiSet.has(this.data.currentDealerIndex) || tenpaiSet.has(this.data.currentDealerIndex));

    // 有流局满贯时不增加本场数
    const hasNagashiMangan = nagashiList.length > 0;

    const updatedPlayers = players.map((player, idx) => ({
      ...player,
      score: player.score,
      isRiichi: false
    }));

    const roundRecord = this.buildDrawHistoryItem({
      tenpaiIndices: Array.from(tenpaiSet),
      nagashiIndices: Array.from(nagashiSet),
      scoreChanges: changes,
      riichiPlayers: allRiichiIndices,
      gainPerTenpai,
      lossPerNoten,
      drawType: isStartingHandDraw ? 'starting' : 'normal'
    });

    const nextHistory = [...this.data.roundHistory, roundRecord];

    const advanceResult = this.advanceRound({
      players: updatedPlayers,
      gameState,
      dealerIndex: this.data.currentDealerIndex,
      dealerContinuation,
      resultType: 'draw',
      hasNagashiMangan  // 传递流局满贯标志
    });

    const singleWinDefaults = this.createDefaultSingleWinTiles();
    const defaultHand = sortTilesDisplay(singleWinDefaults.handTiles);
    const defaultUsage = Object.fromEntries(this.buildTileUsageMap({
      handTiles: defaultHand,
      winTile: singleWinDefaults.winTile,
      melds: singleWinDefaults.melds
    }));

    this.updateGlobalState({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver
    });

    this.setData({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver,
      roundDisplay: this.formatRound(advanceResult.gameState),
      showDrawDialog: false,
      // 清空流局数据
      drawType: null,
      drawTenpaiSelection: [],
      drawNagashiPlayers: [],
      drawShowNagashi: false,
      drawRiichiSelection: [],
      drawScorePreview: null,
      drawScoreError: '',
      // 清空单人和牌数据
      singleWinForm: null,
      singleWinHandTiles: [],
      singleWinHandTileSuits: {},
      singleWinTileUsage: {},
      singleWinWinTile: null,
      singleWinTileTarget: null,
      singleWinMelds: [],
      pendingMeldType: null,
      singleWinAnalysis: null,
      singleWinAnalysisError: null,
      singleWinAutoFill: null,
      singleWinCalcMode: 'auto',
      singleWinManualYaku: [],
      singleWinManualActiveMap: {},
      singleWinManualFu: 40,
      singleWinManualFuro: false,
      singleWinManualHan: 0,
      singleWinManualConflicts: [],
      singleWinExpertHan: 1,
      singleWinExpertFu: 30,
      singleWinTenpaiWaits: [],
      singleWinTenpaiStatus: '',
      singleWinTenpaiExpanded: false,
      singleWinScorePreview: null,
      singleWinScoreError: ''
    });

    this.persistState();
    
    if (advanceResult.isGameOver) {
      this.setData({ showGameOverDialog: true });
    } else {
      this.showToast('流局已记录');
    }
  },

  onDrawCancel() {
    // 只关闭对话框，保留已输入的数据
    this.setData({
      showDrawDialog: false
    });
  },

  onCloseSingleWin() {
    // 只关闭弹窗，保留已输入的数据
    this.setData({ showSingleWinPanel: false });
  },

  onSingleWinModeChange(evt) {
    const { mode } = evt.currentTarget.dataset;
    if (!mode) return;
    let loserIndex = this.data.singleWinForm.loserIndex;
    const winnerIndex = this.data.singleWinForm.winnerIndex;
    if (mode === 'ron') {
      if (loserIndex == null || loserIndex === winnerIndex) {
        loserIndex = this.getDefaultLoserIndex(winnerIndex);
      }
    } else {
      loserIndex = null;
    }
    const nextForm = {
      ...this.data.singleWinForm,
      mode,
      loserIndex
    };
    const status = { ...this.data.singleWinStatus };
    const incompatible = mode === 'tsumo' ? STATUS_RON_ONLY : STATUS_TSUMO_ONLY;
    let statusChanged = false;
    incompatible.forEach(key => {
      if (status[key]) {
        status[key] = false;
        statusChanged = true;
      }
    });
    this.setData({ singleWinForm: nextForm }, () => {
      if (statusChanged) {
        this.applyStatusUpdate(status);
      } else {
        this.refreshAfterStatusChange();
      }
    });
  },

  onSingleWinWinnerChange(evt) {
    const datasetIndex = evt && evt.currentTarget && evt.currentTarget.dataset
      ? evt.currentTarget.dataset.index
      : undefined;
    const rawValue = datasetIndex !== undefined ? datasetIndex : (evt && evt.detail ? evt.detail.value : undefined);
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;
    let loserIndex = this.data.singleWinForm.loserIndex;
    if (this.data.singleWinForm.mode === 'ron') {
      if (loserIndex == null || loserIndex === value) {
        loserIndex = this.getDefaultLoserIndex(value);
      }
    } else {
      loserIndex = null;
    }
    const nextForm = {
      ...this.data.singleWinForm,
      winnerIndex: value,
      loserIndex
    };
    const winner = this.data.players[value] || {};
    const status = { ...this.data.singleWinStatus };
    const canUseRiichi = status.isMenzen && !!winner.isRiichi;
    let statusChanged = false;
    
    // 如果新和牌者有立直且是门清,设置立直状态
    if (canUseRiichi && !status.isRiichi && !status.isDoubleRiichi) {
      status.isRiichi = true;
      statusChanged = true;
    }
    // 如果新和牌者没有立直,清除立直相关状态
    else if (!canUseRiichi && (status.isRiichi || status.isDoubleRiichi || status.isIppatsu)) {
      status.isRiichi = false;
      status.isDoubleRiichi = false;
      status.isIppatsu = false;
      statusChanged = true;
    }
    this.setData({ singleWinForm: nextForm }, () => {
      if (statusChanged) {
        this.applyStatusUpdate(status);
      } else {
        this.refreshAfterStatusChange();
      }
    });
  },

  onSingleWinLoserChange(evt) {
    const datasetIndex = evt && evt.currentTarget && evt.currentTarget.dataset
      ? evt.currentTarget.dataset.index
      : undefined;
    const rawValue = datasetIndex !== undefined ? datasetIndex : (evt && evt.detail ? evt.detail.value : undefined);
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;
    if (value === this.data.singleWinForm.winnerIndex) return;
    const nextForm = {
      ...this.data.singleWinForm,
      loserIndex: value
    };
    this.setData({ singleWinForm: nextForm }, () => {
      this.refreshSingleWinScorePreview(nextForm);
    });
  },

  onSingleWinAnalysisModeChange(evt) {
    const { mode } = evt.currentTarget.dataset || {};
    if (!mode || mode === this.data.singleWinCalcMode) return;
    const updates = {
      singleWinCalcMode: mode,
      singleWinScorePreview: null,
      singleWinScoreError: '',
      singleWinTenpaiWaits: [],
      singleWinTenpaiStatus: '',
      singleWinTenpaiExpanded: false
    };
    if (mode !== 'auto') {
      updates.singleWinAnalysis = null;
      updates.singleWinAnalysisError = '';
    }
    this.setData(updates, () => {
      this.refreshDoraLimits({ calcMode: mode });
      if (mode === 'manual') {
        this.refreshManualResult();
      } else if (mode === 'expert') {
        this.refreshExpertResult();
      } else {
        this.refreshSingleWinAnalysis();
      }
    });
  },

  refreshManualResult() {
    const {
      singleWinManualYaku,
      singleWinManualFuro,
      singleWinManualFu
    } = this.data;
    const doraState = this.data.singleWinDora;
    const { han, conflicts } = mahjongCore.calculateManualHan(singleWinManualYaku, {
      isManualFuro: singleWinManualFuro,
      dora: doraState.dora,
      uraDora: doraState.uraDora,
      redDora: doraState.redDora
    });
    const nextForm = {
      ...this.data.singleWinForm,
      han,
      fu: singleWinManualFu
    };
    const shouldPreview = this.data.singleWinCalcMode === 'manual';
    this.setData({
      singleWinManualHan: han,
      singleWinManualConflicts: conflicts,
      singleWinForm: nextForm
    }, () => {
      if (shouldPreview) {
        this.refreshSingleWinScorePreview(nextForm);
      }
    });
  },

  buildManualYakuActiveMap(list = []) {
    const map = {};
    (Array.isArray(list) ? list : []).forEach(id => {
      if (id !== undefined && id !== null && id !== '') {
        map[id] = true;
      }
    });
    return map;
  },

  refreshExpertResult() {
    const { singleWinExpertHan, singleWinExpertFu } = this.data;
    const doraSummary = this.data.singleWinDoraSummary || computeDoraSummary(
      'expert',
      this.data.singleWinStatus,
      this.data.singleWinDora
    );
    const baseHan = Number.isFinite(singleWinExpertHan) ? singleWinExpertHan : 0;
    const bonusHan = Number(doraSummary && doraSummary.bonus) || 0;
    const totalHan = baseHan + bonusHan;
    const nextForm = {
      ...this.data.singleWinForm,
      han: totalHan,
      fu: singleWinExpertFu
    };
    const shouldPreview = this.data.singleWinCalcMode === 'expert';
    this.setData({ singleWinForm: nextForm }, () => {
      if (shouldPreview) {
        this.refreshSingleWinScorePreview(nextForm);
      }
    });
  },

  onManualYakuToggle(evt) {
    const { yakuid } = evt.currentTarget.dataset || {};
    if (!yakuid) return;
    const current = [...this.data.singleWinManualYaku];
    const index = current.indexOf(yakuid);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(yakuid);
    }
    this.setData({
      singleWinManualYaku: current,
      singleWinManualActiveMap: this.buildManualYakuActiveMap(current)
    }, () => {
      this.refreshManualResult();
    });
  },

  onManualYakuRemove(evt) {
    const { yakuid } = evt.currentTarget.dataset || {};
    if (!yakuid) return;
    const filtered = this.data.singleWinManualYaku.filter(id => id !== yakuid);
    this.setData({
      singleWinManualYaku: filtered,
      singleWinManualActiveMap: this.buildManualYakuActiveMap(filtered)
    }, () => {
      this.refreshManualResult();
    });
  },

  onManualFuSelect(evt) {
    const value = Number(evt.currentTarget.dataset.fu);
    if (Number.isNaN(value)) return;
    this.setData({ singleWinManualFu: value }, () => {
      this.refreshManualResult();
    });
  },

  onManualFuroToggle(evt) {
    const value = !!(evt.detail && evt.detail.value);
    this.setData({ singleWinManualFuro: value }, () => {
      this.refreshManualResult();
    });
  },

  onExpertHanPresetTap(evt) {
    const value = Number(evt.currentTarget.dataset.han);
    if (Number.isNaN(value)) return;
    const han = Math.max(1, Math.min(130, value));
    const nextForm = {
      ...this.data.singleWinForm,
      han
    };
    this.setData({
      singleWinExpertHan: han,
      singleWinForm: nextForm
    }, () => {
      this.refreshSingleWinScorePreview(nextForm);
    });
  },

  onExpertFuPresetTap(evt) {
    const value = Number(evt.currentTarget.dataset.fu);
    if (Number.isNaN(value)) return;
    const fu = Math.max(20, Math.min(110, value));
    const nextForm = {
      ...this.data.singleWinForm,
      fu
    };
    this.setData({
      singleWinExpertFu: fu,
      singleWinForm: nextForm
    }, () => {
      this.refreshSingleWinScorePreview(nextForm);
    });
  },

  onSingleWinInput(evt) {
    const { field } = evt.currentTarget.dataset;
    if (!field) return;
    const rawValue = evt.detail.value;
    if (rawValue === '' || rawValue == null) {
      const nextForm = {
        ...this.data.singleWinForm,
        [field]: null
      };
      const updates = { singleWinForm: nextForm };
      if (this.data.singleWinCalcMode === 'expert') {
        if (field === 'han') updates.singleWinExpertHan = null;
        if (field === 'fu') updates.singleWinExpertFu = null;
      }
      this.setData(updates, () => {
        this.refreshSingleWinScorePreview(nextForm);
      });
      return;
    }

    let value = Number(rawValue);
    if (Number.isNaN(value)) value = this.data.singleWinForm[field];
    value = Math.max(0, Math.floor(value));
    if (field === 'han') {
      if (value < 1) value = 1;
      if (value > 130) value = 130;
    }
    if (field === 'fu') {
      if (value < 20) value = 20;
      if (value > 110) value = 110;
    }
    const nextForm = {
      ...this.data.singleWinForm,
      [field]: value
    };
    const updates = { singleWinForm: nextForm };
    if (this.data.singleWinCalcMode === 'expert') {
      if (field === 'han') updates.singleWinExpertHan = value;
      if (field === 'fu') updates.singleWinExpertFu = value;
    }
    this.setData(updates, () => {
      this.refreshSingleWinScorePreview(nextForm);
    });
  },

  onTogglePlayerRiichi(evt) {
    if (!this.ensureGameReady()) return;
    const index = Number(evt.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const players = clonePlayers(this.data.players);
    const target = players[index];
    if (!target) return;

    const wasRiichi = !!target.isRiichi;
    target.isRiichi = !target.isRiichi;

    const gameState = { ...this.data.gameState };
    if (!wasRiichi && target.isRiichi) {
      target.score -= 1000;
      gameState.riichiSticks = (gameState.riichiSticks || 0) + 1;
    } else if (wasRiichi && !target.isRiichi) {
      target.score += 1000;
      gameState.riichiSticks = Math.max(0, (gameState.riichiSticks || 0) - 1);
    }

    this.updateGlobalState({ players, gameState });
    this.setData({ players, gameState, roundDisplay: this.formatRound(gameState) }, () => {
      this.refreshSingleWinAnalysis();
    });
    this.persistState();
  },

  onConfirmSingleWin() {
    if (!this.ensureGameReady()) return;
    const { singleWinForm, players, gameState, currentDealerIndex, singleWinCalcMode, singleWinHandTiles, singleWinWinTile, singleWinMelds } = this.data;
    const { mode, winnerIndex, loserIndex, han, fu } = singleWinForm;

    // 自动分析模式下，检查手牌和和牌张是否选择完整
    if (singleWinCalcMode === 'auto') {
      // 检查是否选择了和牌张
      if (!singleWinWinTile) {
        wx.showToast({
          title: '请选择和牌张',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 计算需要的手牌数量
      const requiredCount = this.getRequiredHandTileCount(singleWinHandTiles, singleWinMelds);
      const currentCount = (singleWinHandTiles || []).length;
      
      if (currentCount < requiredCount) {
        wx.showToast({
          title: `请选择完整手牌（还差${requiredCount - currentCount}张）`,
          icon: 'none',
          duration: 2000
        });
        return;
      }
    }

    if (winnerIndex == null || winnerIndex < 0 || winnerIndex >= players.length) {
      this.showToast('请选择和牌者');
      return;
    }
    const isTsumo = mode === 'tsumo';
    if (!isTsumo) {
      if (loserIndex == null || loserIndex === winnerIndex) {
        this.showToast('荣和需选择放铳者');
        return;
      }
    }
    if (han <= 0) {
      this.showToast('番数至少为 1');
      return;
    }
    if (fu < 20 && !(han >= 13)) {
      this.showToast('符数至少为 20');
      return;
    }

    const isDealer = winnerIndex === currentDealerIndex;
    const scoreData = scoreUtils.calculateScore(han, fu, isDealer, gameState.honba || 0, isTsumo);
    if (!scoreData) {
      this.showToast('番符组合无效或暂未支持');
      return;
    }

    const riichiPlayers = players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.isRiichi)
      .map(({ idx }) => idx);

    const changes = scoreUtils.getScoreDistribution({
      analysis: { han, fu },
      scoreData,
      winnerIndex,
      loserIndex: isTsumo ? null : loserIndex,
      isTsumo,
      currentDealerIndex,
      riichiSticks: gameState.riichiSticks || 0,
      playerCount: players.length
    });

    const updatedPlayers = players.map((player, idx) => ({
      ...player,
      score: player.score + (changes[idx] || 0),
      isRiichi: false
    }));

    const roundRecord = this.buildRoundHistoryItem({
      winnerIndex,
      loserIndex: isTsumo ? null : loserIndex,
      isTsumo,
      han,
      fu,
      scoreData,
      scoreChanges: changes,
      riichiPlayers,
      handTiles: this.data.singleWinHandTiles,
      winTile: this.data.singleWinWinTile,
      melds: this.data.singleWinMelds,
      isMenzen: this.isCurrentHandMenzen(this.data.singleWinMelds)
    });

    const nextHistory = [...this.data.roundHistory, roundRecord];

    const nextGameState = {
      ...gameState,
      riichiSticks: 0
    };

    const advanceResult = this.advanceRound({
      players: updatedPlayers,
      gameState: nextGameState,
      dealerIndex: currentDealerIndex,
      dealerContinuation: winnerIndex === currentDealerIndex
    });

    const singleWinDefaults = this.createDefaultSingleWinTiles();

    this.updateGlobalState({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver
    });

    this.setData({
      players: advanceResult.players,
      gameState: advanceResult.gameState,
      currentDealerIndex: advanceResult.currentDealerIndex,
      roundHistory: nextHistory,
      isGameOver: advanceResult.isGameOver,
      roundDisplay: this.formatRound(advanceResult.gameState),
      showSingleWinPanel: false,
      // 清空数据,下次打开时会重新初始化
      singleWinForm: null,
      singleWinHandTiles: [],
      singleWinWinTile: null,
      singleWinTileTarget: null,
      singleWinMelds: [],
      pendingMeldType: null,
      singleWinAnalysis: null,
      singleWinAnalysisError: null,
      singleWinAutoFill: null,
      singleWinTenpaiWaits: [],
      singleWinTenpaiStatus: '',
      singleWinTenpaiExpanded: false,
      singleWinScorePreview: null,
      singleWinScoreError: ''
    });

    this.persistState();
    
    if (advanceResult.isGameOver) {
      this.setData({ showGameOverDialog: true });
    } else {
      this.showToast('结算完成');
    }
  },

  persistState() {
    const app = getApp();
    storage.saveGame({
      gameSettings: app.globalData.gameSettings,
      isGameOver: app.globalData.isGameOver,
      players: app.globalData.players,
      gameState: app.globalData.gameState,
      currentDealerIndex: app.globalData.currentDealerIndex,
      roundHistory: app.globalData.roundHistory
    });
  },

  showToast(message) {
    this.setData({
      toast: {
        visible: true,
        message
      }
    });
    setTimeout(() => {
      this.setData({
        'toast.visible': false,
        'toast.message': ''
      });
    }, 1600);
  },

  createDefaultSingleWinForm(winnerIndex) {
    const safeIndex = Number.isFinite(winnerIndex) ? winnerIndex : 0;
    return {
      mode: 'tsumo',
      winnerIndex: safeIndex,
      loserIndex: null,
      han: 1,
      fu: 30
    };
  },

  createDefaultSingleWinTiles() {
    return {
      handTiles: [],
      winTile: null,
      target: 'hand',
      melds: [],
      pendingMeldType: '',
      analysis: null,
      analysisError: '',
      autoFill: true
    };
  },

  mapHandTileSuits(handTiles = []) {
    return handTiles.map(tile => tileSuitMap[tile] || 'man');
  },

  recalcTileUsage(overrides = {}) {
    const params = {
      handTiles: overrides.handTiles !== undefined ? overrides.handTiles : this.data.singleWinHandTiles,
      winTile: overrides.winTile !== undefined ? overrides.winTile : this.data.singleWinWinTile,
      melds: overrides.melds !== undefined ? overrides.melds : this.data.singleWinMelds
    };
    return Object.fromEntries(this.buildTileUsageMap(params));
  },

  handleMeldTileSelection(tile) {
    if (this.data.singleWinMelds.length >= 4) {
      this.showToast('副露最多 4 组');
      return;
    }
    const type = this.data.pendingMeldType;
    if (!type) {
      this.showToast('请选择副露类型');
      return;
    }
    const meld = this.buildMeldFromSelection(type, tile);
    if (!meld) return;
    
    // 计算添加副露后的最大手牌数
    const nextMelds = [...this.data.singleWinMelds, meld];
    const maxHandTiles = this.calculateMaxHandTiles(nextMelds);
    
    // 检查当前手牌数是否超出新的上限
    const currentHandCount = this.data.singleWinHandTiles.length;
    if (currentHandCount > maxHandTiles) {
      const excessTiles = currentHandCount - maxHandTiles;
      this.showToast(`添加副露后手牌超出上限,请先移除 ${excessTiles} 张手牌`);
      return;
    }
    
    const nextUsage = this.recalcTileUsage({ melds: nextMelds });
    this.setData({
      singleWinMelds: nextMelds,
      singleWinTileUsage: nextUsage,
      singleWinMaxHandTiles: maxHandTiles
    }, () => {
      const isMenzen = this.isCurrentHandMenzen(nextMelds);
      if (isMenzen !== this.data.singleWinStatus.isMenzen) {
        const nextStatus = { ...this.data.singleWinStatus, isMenzen };
        if (!isMenzen) {
          STATUS_MENZEN_KEYS.forEach(key => {
            nextStatus[key] = false;
          });
        }
        this.applyStatusUpdate(nextStatus, {
          skipAnalysis: true,
          afterUpdate: () => {
            this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
          }
        });
      } else {
        this.refreshDoraLimits({ usageMap: nextUsage });
        this.refreshSingleWinAnalysis({ externalMelds: nextMelds });
      }
    });
  },

  buildMeldFromSelection(type, baseTile) {
    const internal = displayToInternal[baseTile];
    if (!internal) {
      this.showToast('未识别的牌面');
      return null;
    }

    const num = parseInt(internal[0], 10);
    const suit = internal[1];
    let tiles = [];

    if (type === 'shuntsu') {
      if (suit === 'z') {
        this.showToast('顺子仅适用于数牌');
        return null;
      }
      if (num >= 8) {
        this.showToast('顺子需从 1-7 起牌');
        return null;
      }
      const internalTiles = [internal, `${num + 1}${suit}`, `${num + 2}${suit}`];
      tiles = internalTiles.map(code => internalToDisplay[code]).filter(Boolean);
      if (tiles.length !== 3) {
        this.showToast('顺子生成失败');
        return null;
      }
    } else if (type === 'pon') {
      tiles = [baseTile, baseTile, baseTile];
    } else if (type === 'minkan' || type === 'ankan') {
      tiles = [baseTile, baseTile, baseTile, baseTile];
    } else {
      this.showToast('暂不支持的副露类型');
      return null;
    }

    if (!this.canAddMeldTiles(tiles)) {
      this.showToast('加入后将超过 4 张同牌');
      return null;
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      tiles
    };
  },

  canAddMeldTiles(tiles = []) {
    const uniqueTiles = Array.from(new Set(tiles));
    return uniqueTiles.every(tile => this.countTileUsage(tile, { additionalTiles: tiles }) <= 4);
  },

  countTileUsage(tile, options = {}) {
    const {
      additionalTiles = [],
      includeWin = true
    } = options;

    const handCount = (this.data.singleWinHandTiles || []).filter(t => t === tile).length;
    const winCount = includeWin && this.data.singleWinWinTile === tile ? 1 : 0;
    const meldCount = (this.data.singleWinMelds || []).reduce((sum, meld) => {
      const list = meld && Array.isArray(meld.tiles) ? meld.tiles : [];
      return sum + list.filter(t => t === tile).length;
    }, 0);
    const extraCount = (additionalTiles || []).filter(t => t === tile).length;
    return handCount + winCount + meldCount + extraCount;
  },

  buildTileUsageMap(options = {}) {
    const map = new Map();
    const increment = (key, amount = 1) => {
      const prev = map.get(key) || 0;
      map.set(key, prev + amount);
    };

    const handTiles = options.handTiles !== undefined ? options.handTiles : (this.data.singleWinHandTiles || []);
    handTiles.forEach(tile => increment(tile));

    const winTile = options.winTile !== undefined ? options.winTile : this.data.singleWinWinTile;
    if (winTile) increment(winTile);

    const melds = options.melds !== undefined ? options.melds : (this.data.singleWinMelds || []);
    melds.forEach(meld => {
      if (meld && Array.isArray(meld.tiles)) {
        meld.tiles.forEach(tile => increment(tile));
      }
    });

    return map;
  },

  getRequiredHandTileCount(handTiles = [], externalMelds = []) {
    const melds = externalMelds || [];
    const totalExternalTiles = melds.reduce((sum, meld) => sum + (Array.isArray(meld.tiles) ? meld.tiles.length : 0), 0);
    const kanCount = melds.filter(meld => KAN_TYPES.has(meld.type)).length;
    const required = 13 + kanCount - totalExternalTiles;
    return required >= 0 ? required : 0;
  },

  isCurrentHandMenzen(melds = []) {
    if (!melds || melds.length === 0) {
      return true;
    }
    return melds.every(meld => meld && meld.type === 'ankan');
  },

  calculateMaxHandTiles(melds = []) {
    // 基础手牌数量是 13 张
    // 每组副露（顺子、刻子）减少 3 张
    // 每组杠子（明杠、暗杠）减少 3 张（4张副露牌 - 1张补牌 = 减3）
    let maxTiles = 13;
    melds.forEach(meld => {
      const type = meld && meld.type;
      if (type === 'shuntsu' || type === 'pon') {
        maxTiles -= 3;
      } else if (type === 'minkan' || type === 'ankan') {
        // 杠子: 4张副露 - 1张补牌 = 减3
        maxTiles -= 3;
      }
    });
    return Math.max(0, maxTiles);
  },

  getDefaultLoserIndex(winnerIndex) {
    const { players } = this.data;
    for (let i = 0; i < players.length; i += 1) {
      if (i !== winnerIndex) {
        return i;
      }
    }
    return null;
  },

  validateMultiWinInputs() {
    const { multiWinWinners, multiWinLoser, multiWinHanFu, players } = this.data;
    if (!multiWinWinners || multiWinWinners.length === 0) {
      return '请至少选择一位和牌者';
    }
    if (multiWinLoser == null || Number.isNaN(multiWinLoser)) {
      return '请选择放铳者';
    }
    if (multiWinWinners.includes(multiWinLoser)) {
      return '放铳者不能同时是和牌者';
    }
    for (let i = 0; i < multiWinWinners.length; i += 1) {
      const winnerIdx = multiWinWinners[i];
      if (!Number.isInteger(winnerIdx) || !players[winnerIdx]) {
        return '和牌者选择无效';
      }
      const hanFu = multiWinHanFu[winnerIdx];
      if (!hanFu) {
        return `${players[winnerIdx].name || '玩家'} 的番符未设置`;
      }
      const rawHan = hanFu.han;
      if (rawHan === '' || rawHan === undefined || rawHan === null) {
        return `${players[winnerIdx].name || '玩家'} 的番数需填写`;
      }
      const han = Number(rawHan);
      if (!Number.isFinite(han) || han <= 0) {
        return `${players[winnerIdx].name || '玩家'} 的番数需大于 0`;
      }
      if (han < 13) {
        const rawFu = hanFu.fu;
        if (rawFu === '' || rawFu === undefined || rawFu === null) {
          return `${players[winnerIdx].name || '玩家'} 的符数需填写`;
        }
        const fu = Number(rawFu);
        if (!Number.isFinite(fu) || fu < 20) {
          return `${players[winnerIdx].name || '玩家'} 的符数需不少于 20`;
        }
      }
    }
    return null;
  },

  refreshMultiWinScorePreview() {
    const validationError = this.validateMultiWinInputs();
    if (validationError) {
      this.setData({
        multiWinScorePreview: null,
        multiWinScoreError: validationError
      });
      return;
    }

    const {
      multiWinWinners,
      multiWinLoser,
      multiWinHanFu,
      players,
      gameState,
      currentDealerIndex
    } = this.data;

    const baseChanges = scoreUtils.calculateMultiWinScores({
      playerCount: players.length,
      multiWinners: multiWinWinners,
      multiWinLoser,
      multiWinHanFu,
      currentDealerIndex,
      honba: (gameState && gameState.honba) || 0
    });

    const riichiBonus = ((gameState && gameState.riichiSticks) || 0) * 1000;
    const winnersSet = new Set(multiWinWinners);
    const bonusPerWinner = multiWinWinners.length > 0 && riichiBonus > 0
      ? Math.floor(riichiBonus / multiWinWinners.length)
      : 0;

    const changes = baseChanges.map((delta, idx) => {
      let nextDelta = delta || 0;
      if (winnersSet.has(idx)) {
        nextDelta += bonusPerWinner;
      }
      return nextDelta;
    });

    const previewChanges = players.map((player, idx) => {
      const delta = changes[idx] || 0;
      const absFormatted = formatNumber(Math.abs(delta));
      const label = delta === 0 ? '0' : (delta > 0 ? `+${absFormatted}` : `-${absFormatted}`);
      return {
        name: player.name,
        delta,
        deltaLabel: label
      };
    });

    const totalGain = multiWinWinners.reduce((sum, idx) => sum + (changes[idx] || 0), 0);
    const loserLoss = Math.abs(changes[multiWinLoser] || 0);
    const loserName = players[multiWinLoser] ? players[multiWinLoser].name : '';
    const winnerNames = multiWinWinners.map(idx => (players[idx] ? players[idx].name : '')).filter(Boolean);

    const summaryParts = [];
    if (winnerNames.length) {
      summaryParts.push(`和牌者 ${winnerNames.join('、')} 收益 ${formatNumber(totalGain)}`);
    }
    if (loserName) {
      summaryParts.push(`放铳者 ${loserName} 支付 ${formatNumber(loserLoss)}`);
    }
    if (bonusPerWinner > 0) {
      summaryParts.push(`立直棒每人 +${formatNumber(bonusPerWinner)}`);
    }

    const winnerDetails = multiWinWinners.map(idx => {
      const player = players[idx] || {};
      const hanFu = multiWinHanFu[idx] || { han: 0, fu: 0 };
      const isDealer = idx === currentDealerIndex;
      const scoreData = scoreUtils.calculateScore(
        Number(hanFu.han) || 0,
        Number(hanFu.fu) || 0,
        isDealer,
        (gameState && gameState.honba) || 0,
        false
      ) || { total: 0 };
      return {
        name: player.name,
        han: Number(hanFu.han) || 0,
        fu: Number(hanFu.han) >= 13 ? '—' : Number(hanFu.fu) || 0,
        points: formatNumber(scoreData.total || 0),
        bonus: bonusPerWinner ? formatNumber(bonusPerWinner) : ''
      };
    });

    const summaryText = summaryParts.length
      ? summaryParts.join('；')
      : '分数将根据番符和放铳者自动计算';

    this.setData({
      multiWinScorePreview: {
        summary: summaryText,
        changes: previewChanges,
        winnerDetails
      },
      multiWinScoreError: ''
    });
  },

  buildTenpaiPreview(handTiles = [], formOverride, externalMeldsOverride) {
    if (this.data.singleWinCalcMode !== 'auto') {
      return { waits: [], status: '' };
    }

    const externalMelds = externalMeldsOverride !== undefined ? externalMeldsOverride : this.data.singleWinMelds;
    const form = formOverride || this.data.singleWinForm;
    const requiredCount = this.getRequiredHandTileCount(handTiles, externalMelds);
    const result = { waits: [], status: '' };

    if (!handTiles || handTiles.length === 0) {
      result.status = '录入手牌后显示听牌结果';
      return result;
    }

    if (requiredCount <= 0) {
      result.status = '录入手牌后显示听牌结果';
      return result;
    }

    if (handTiles.length < requiredCount) {
      const diff = requiredCount - handTiles.length;
      if (diff === 1) {
        result.status = '还需 1 张手牌';
      } else {
        result.status = `还需 ${diff} 张手牌（含副露需 ${requiredCount} 张）`;
      }
      return result;
    }

    if (handTiles.length > requiredCount) {
      result.status = `手牌多出 ${handTiles.length - requiredCount} 张（含副露需 ${requiredCount} 张）`;
      return result;
    }

    const internalHand = handTiles
      .map(tile => displayToInternal[tile])
      .filter(Boolean);

    if (internalHand.length !== handTiles.length) {
      result.status = '存在未识别的牌面';
      return result;
    }

    const simpleWaits = mahjongCore.findTenpaiWaits(internalHand, externalMelds);

    if (!simpleWaits || !simpleWaits.length) {
      result.status = '未听牌';
      return result;
    }

  const context = this.buildAnalysisContext(form, externalMelds);
  const { currentDealerIndex = 0, gameState = {} } = this.data;
  const winnerIndex = Number.isInteger(form && form.winnerIndex) ? form.winnerIndex : currentDealerIndex;
    const isDealer = winnerIndex === currentDealerIndex;
    const honba = Number.isFinite(gameState.honba) ? gameState.honba : 0;
  const isTsumo = form && form.mode === 'tsumo';
    const doraState = this.data.singleWinDora || {};
    const doraBonus = (Number(doraState.dora) || 0) + (Number(doraState.redDora) || 0);

    const waits = [];
    simpleWaits.forEach(waitTile => {
      if (this.countTileUsage(waitTile, { includeWin: false }) >= 4) {
        return;
      }

      let analysis;
      try {
        analysis = mahjongCore.analyzeHand(handTiles, waitTile, {
          ...context,
          externalMelds
        });
      } catch (err) {
        console.error('Failed to analyze tenpai wait', err);
        analysis = null;
      }

      if (!analysis) return;

      const baseHan = Number(analysis.han) || 0;
      const totalHan = baseHan + doraBonus;
      if (totalHan <= 0) return;

      const scoreData = scoreUtils.calculateScore(
        totalHan,
        analysis.fu,
        isDealer,
        honba,
        isTsumo
      );

      if (!scoreData || !scoreData.total) return;

      waits.push({
        tile: waitTile,
        yaku: analysis.yaku && analysis.yaku.length ? analysis.yaku.join('/') : '(无役)',
        han: totalHan,
        fu: analysis.fu,
        score: scoreData.total,
        scoreLabel: `${formatNumber(scoreData.total)} 点`
      });
    });

    if (!waits.length) {
      result.status = '未听牌';
      return result;
    }

    waits.sort((a, b) => {
      if (b.han !== a.han) return b.han - a.han;
      if (b.fu !== a.fu) return b.fu - a.fu;
      return b.score - a.score;
    });

    result.waits = waits;
    return result;
  },

  refreshSingleWinAnalysis(overrides = {}) {
    if (this.data.singleWinCalcMode !== 'auto') {
      const overrideForm = overrides.singleWinForm || this.data.singleWinForm;
      this.refreshSingleWinScorePreview(overrideForm);
      return;
    }
    const handTiles = overrides.handTiles || this.data.singleWinHandTiles;
    const winTile = overrides.winTile !== undefined ? overrides.winTile : this.data.singleWinWinTile;
    const form = overrides.singleWinForm || this.data.singleWinForm;
    const externalMelds = overrides.externalMelds !== undefined ? overrides.externalMelds : this.data.singleWinMelds;
    const tenpaiPreview = this.buildTenpaiPreview(handTiles, form, externalMelds);
    const requiredHandTileCount = this.getRequiredHandTileCount(handTiles, externalMelds);

    if (!handTiles || handTiles.length === 0) {
      this.setData({
        singleWinTenpaiWaits: tenpaiPreview.waits,
        singleWinTenpaiStatus: tenpaiPreview.status,
        singleWinAnalysis: null,
        singleWinAnalysisError: requiredHandTileCount > 0 ? `还需 ${requiredHandTileCount} 张手牌` : ''
      });
      this.refreshSingleWinScorePreview(form);
      return;
    }

    if (handTiles.length > requiredHandTileCount) {
      this.setData({
        singleWinTenpaiWaits: tenpaiPreview.waits,
        singleWinTenpaiStatus: tenpaiPreview.status,
        singleWinAnalysis: null,
        singleWinAnalysisError: `手牌多出 ${handTiles.length - requiredHandTileCount} 张（含副露需 ${requiredHandTileCount} 张）`
      });
      this.refreshSingleWinScorePreview(form);
      return;
    }

    if (handTiles.length < requiredHandTileCount) {
      const diff = requiredHandTileCount - handTiles.length;
      this.setData({
        singleWinTenpaiWaits: tenpaiPreview.waits,
        singleWinTenpaiStatus: tenpaiPreview.status,
        singleWinAnalysis: null,
        singleWinAnalysisError: diff === 1
          ? '还需 1 张手牌'
          : `还需 ${diff} 张手牌（含副露需 ${requiredHandTileCount} 张）`
      });
      this.refreshSingleWinScorePreview(form);
      return;
    }

    if (!winTile) {
      this.setData({
        singleWinTenpaiWaits: tenpaiPreview.waits,
        singleWinTenpaiStatus: tenpaiPreview.status,
        singleWinAnalysis: null,
        singleWinAnalysisError: '请选择和牌'
      });
      this.refreshSingleWinScorePreview(form);
      return;
    }

    let analysis = null;
    let error = '';
    const doraSummary = computeDoraSummary(this.data.singleWinCalcMode, this.data.singleWinStatus, this.data.singleWinDora);
    try {
      const context = this.buildAnalysisContext(form, externalMelds);
      analysis = mahjongCore.analyzeHand(handTiles, winTile, {
        ...context,
        externalMelds
      });
    } catch (err) {
      console.error('Failed to analyze hand', err);
      error = '自动分析失败';
    }

    if (!analysis && !error) {
      error = '未找到可用役种组合';
    }

    if (analysis) {
      const baseHan = Number(analysis.han) || 0;
      const totalHan = baseHan + doraSummary.bonus;
      analysis = {
        ...analysis,
        baseHan,
        bonusHan: doraSummary.bonus,
        doraBreakdown: doraSummary,
        han: totalHan
      };
    }

    const nextData = {
      singleWinTenpaiWaits: tenpaiPreview.waits,
      singleWinTenpaiStatus: tenpaiPreview.status,
      singleWinAnalysis: analysis,
      singleWinAnalysisError: error,
      singleWinDoraSummary: doraSummary
    };

    if (analysis && this.data.singleWinAutoFill) {
      nextData.singleWinForm = {
        ...form,
        han: analysis.han,
        fu: analysis.fu || (analysis.han >= 13 ? 0 : (Number.isFinite(form.fu) ? form.fu : 20))
      };
    }

    this.setData(nextData, () => {
      this.refreshSingleWinScorePreview(nextData.singleWinForm || form);
    });
  },

  buildAnalysisContext(form, externalMeldsOverride) {
    const effectiveForm = form || this.data.singleWinForm;
    const { players, gameState, gameSettings } = this.data;
    const externalMelds = externalMeldsOverride !== undefined ? externalMeldsOverride : this.data.singleWinMelds;
    const winner = players[effectiveForm.winnerIndex] || {};
    const playerWind = displayWindToInternal[winner.wind] || 'east';
    const status = this.data.singleWinStatus || DEFAULT_STATUS;
    const isMenzen = this.isCurrentHandMenzen(externalMelds);
    const app = getApp();
    const useKlassicYaku = (gameSettings || app.globalData.gameSettings || {}).useKlassicYaku || false;
    return {
      isTsumo: effectiveForm.mode === 'tsumo',
      isMenzen,
      isRiichi: !!status.isRiichi,
      isDoubleRiichi: !!status.isDoubleRiichi,
      isIppatsu: !!status.isIppatsu,
      isTenhou: !!status.isTenhou,
      isChiihou: !!status.isChiihou,
      isRenhou: !!status.isRenhou,
      isHaitei: !!status.isHaitei,
      isHoutei: !!status.isHoutei,
      isRinshan: !!status.isRinshan,
      isChankan: !!status.isChankan,
      playerWind,
      roundWind: (gameState && gameState.wind) || 'east',
      externalMelds: externalMelds || [],
      useKlassicYaku
    };
  },

  refreshSingleWinScorePreview(formOverride) {
    const form = formOverride || this.data.singleWinForm;
    if (!form) return;

    const { players, gameState, currentDealerIndex } = this.data;
    const { mode, winnerIndex, loserIndex, han, fu } = form;

    const calcMode = this.data.singleWinCalcMode;

    if (calcMode === 'auto') {
      const requiredHandTiles = this.getRequiredHandTileCount(this.data.singleWinHandTiles, this.data.singleWinMelds);
      const hasCompleteHand = requiredHandTiles > 0 && this.data.singleWinHandTiles.length === requiredHandTiles;
      const hasWinTile = !!this.data.singleWinWinTile;
      if (!hasCompleteHand || !hasWinTile) {
        this.setData({
          singleWinScorePreview: null,
          singleWinScoreError: '录入完整牌姿后可预览得分'
        });
        return;
      }
    }

    if (winnerIndex == null || !players[winnerIndex]) {
      this.setData({
        singleWinScorePreview: null,
        singleWinScoreError: '选择和牌者后可预览得失分'
      });
      return;
    }

    if (calcMode === 'manual') {
      if (!this.data.singleWinManualYaku.length) {
        this.setData({
          singleWinScorePreview: null,
          singleWinScoreError: '请选择至少一个役种'
        });
        return;
      }
      if (this.data.singleWinManualConflicts && this.data.singleWinManualConflicts.length) {
        this.setData({
          singleWinScorePreview: null,
          singleWinScoreError: this.data.singleWinManualConflicts.join('；')
        });
        return;
      }
    }

    const effectiveHan = Number.isFinite(han) ? han : 0;
    const effectiveFu = Number.isFinite(fu) ? fu : 0;

    if (effectiveHan <= 0) {
      this.setData({
        singleWinScorePreview: null,
        singleWinScoreError: '番数需大于 0 才能预览得分'
      });
      return;
    }

    if (mode === 'ron') {
      if (loserIndex == null || loserIndex === winnerIndex || !players[loserIndex]) {
        this.setData({
          singleWinScorePreview: null,
          singleWinScoreError: '荣和需选定放铳者'
        });
        return;
      }
    }

    if (effectiveFu < 20 && effectiveHan < 13) {
      this.setData({
        singleWinScorePreview: null,
        singleWinScoreError: '符数不足 20，无法计算'
      });
      return;
    }

    if (!gameState) {
      this.setData({
        singleWinScorePreview: null,
        singleWinScoreError: '尚未加载对局状态'
      });
      return;
    }

    const isTsumo = mode === 'tsumo';
    const isDealer = winnerIndex === currentDealerIndex;
    const scoreData = scoreUtils.calculateScore(
      effectiveHan,
      effectiveFu,
      isDealer,
      gameState.honba || 0,
      isTsumo
    );

    if (!scoreData) {
      this.setData({
        singleWinScorePreview: null,
        singleWinScoreError: '番符组合暂未支持，无法预览'
      });
      return;
    }

    const riichiSticks = gameState.riichiSticks || 0;
    const changes = scoreUtils.getScoreDistribution({
      analysis: { han: effectiveHan, fu: effectiveFu },
      scoreData,
      winnerIndex,
      loserIndex: isTsumo ? null : loserIndex,
      isTsumo,
      currentDealerIndex,
      riichiSticks,
      playerCount: players.length
    });

    let summary = '';
    if (isTsumo) {
      if (isDealer) {
        summary = `自摸：每人支付 ${scoreData.each || 0} 点，合计 ${scoreData.total || 0} 点`;
      } else {
        summary = `自摸：庄家支付 ${scoreData.dealer || 0} 点，闲家各支付 ${scoreData.nonDealer || 0} 点`;
      }
    } else {
      summary = `荣和：放铳者支付 ${scoreData.total || 0} 点`;
    }

    if (riichiSticks > 0) {
      summary += `（含 ${riichiSticks} 根立直棒，共 ${riichiSticks * 1000} 点）`;
    }

    const previewChanges = players.map((player, idx) => ({
      name: player.name,
      delta: changes[idx] || 0
    }));

    this.setData({
      singleWinScorePreview: {
        summary,
        changes: previewChanges
      },
      singleWinScoreError: ''
    });
  },

  ensureGameReady() {
    if (!this.data.loaded || !this.data.gameState) {
      this.showToast('请先开始对局');
      return false;
    }
    if (this.data.isGameOver) {
      this.showToast('对局已结束');
      return false;
    }
    return true;
  },

  updateGlobalState(partial) {
    const app = getApp();
    Object.assign(app.globalData, partial);
  },

  buildRoundHistoryItem({ winnerIndex, loserIndex, isTsumo, han, fu, scoreData, scoreChanges, riichiPlayers, handTiles = [], winTile = null, melds = [], isMenzen = true }) {
    const players = this.data.players;
    const gameState = this.data.gameState;
    const finalScores = players.map((p, idx) => p.score + (scoreChanges[idx] || 0));
    const playerSnapshots = players.map((p, idx) => ({
      name: p.name,
      finalScore: finalScores[idx],
      delta: scoreChanges[idx] || 0
    }));
    const handSnapshot = {
      handTiles: sortTilesDisplay(handTiles || []),
      winTile: winTile || null,
      melds: cloneMelds(melds || []),
      isMenzen,
      statusFlags: { ...this.data.singleWinStatus },
      dora: { ...this.data.singleWinDora },
      doraSummary: { ...this.data.singleWinDoraSummary }
    };
    return {
      id: Date.now(),
      roundLabel: buildRoundLabel(gameState),
      type: isTsumo ? '自摸' : '荣和',
      winner: players[winnerIndex] ? players[winnerIndex].name : '',
      loser: loserIndex != null && players[loserIndex] ? players[loserIndex].name : null,
      han,
      fu,
      scoreSummary: scoreData,
      scoreChanges,
      finalScores,
      playerSnapshots,
      riichiPlayers: riichiPlayers.map(idx => (players[idx] ? players[idx].name : '')),
      handSnapshot,
      createdAt: new Date().toISOString()
    };
  },

  buildMultiWinHistoryItem({ winners = [], loserIndex = null, hanFuMap = {}, scoreChanges = [], riichiPlayers = [], bonusPerWinner = 0 }) {
    const players = this.data.players;
    const gameState = this.data.gameState;
    const finalScores = players.map((p, idx) => p.score + (scoreChanges[idx] || 0));
    const playerSnapshots = players.map((p, idx) => ({
      name: p.name,
      finalScore: finalScores[idx],
      delta: scoreChanges[idx] || 0
    }));

    const winnerDetails = winners.map(idx => {
      const player = players[idx] || {};
      const hanFu = hanFuMap[idx] || { han: 0, fu: 0 };
      const isDealer = idx === this.data.currentDealerIndex;
      const scoreData = scoreUtils.calculateScore(
        Number(hanFu.han) || 0,
        Number(hanFu.fu) || 0,
        isDealer,
        (gameState && gameState.honba) || 0,
        false
      ) || { total: 0 };
      return {
        name: player.name,
        han: Number(hanFu.han) || 0,
        fu: Number(hanFu.han) >= 13 ? '—' : Number(hanFu.fu) || 0,
        points: scoreData.total || 0,
        bonus: bonusPerWinner,
        isDealer
      };
    });

    const loserName = players[loserIndex] ? players[loserIndex].name : null;
    const riichiNames = (riichiPlayers || [])
      .map(idx => (players[idx] ? players[idx].name : ''))
      .filter(name => !!name);

    const totalGain = winners.reduce((sum, idx) => sum + (scoreChanges[idx] || 0), 0);
    const loserLoss = scoreChanges[loserIndex] || 0;
    const riichiBonusTotal = ((gameState && gameState.riichiSticks) || 0) * 1000;

    return {
      id: Date.now(),
      roundLabel: buildRoundLabel(gameState),
      type: '多人和牌',
      winner: winnerDetails.map(detail => detail.name).join('、'),
      loser: loserName,
      han: '—',
      fu: '—',
      scoreSummary: {
        totalGain,
        loserLoss,
        bonusPerWinner,
        riichiBonus: riichiBonusTotal
      },
      multiWinDetails: winnerDetails,
      scoreChanges,
      finalScores,
      playerSnapshots,
      riichiPlayers: riichiNames,
      createdAt: new Date().toISOString()
    };
  },

  buildDrawHistoryItem({
    tenpaiIndices = [],
    nagashiIndices = [],
    scoreChanges = [],
    riichiPlayers = [],
    gainPerTenpai = 0,
    lossPerNoten = 0,
    drawType = 'normal'
  }) {
    const players = this.data.players;
    const gameState = this.data.gameState;
    const tenpaiNames = tenpaiIndices
      .map(idx => (players[idx] ? players[idx].name : null))
      .filter(Boolean);
    const nagashiNames = nagashiIndices
      .map(idx => (players[idx] ? players[idx].name : null))
      .filter(Boolean);

    const finalScores = players.map((p, idx) => p.score + (scoreChanges[idx] || 0));
    const playerSnapshots = players.map((p, idx) => ({
      name: p.name,
      finalScore: finalScores[idx],
      delta: scoreChanges[idx] || 0
    }));

    const riichiNames = (riichiPlayers || [])
      .map(idx => (players[idx] ? players[idx].name : ''))
      .filter(name => !!name);

    const normalizedDrawType = drawType === 'starting' ? 'starting' : 'normal';

    return {
      id: Date.now(),
      roundLabel: buildRoundLabel(gameState),
      type: '流局',
      winner: '',
      loser: null,
      han: '—',
      fu: '—',
      scoreSummary: {
        tenpaiCount: tenpaiNames.length,
        notenCount: Math.max(0, players.length - tenpaiNames.length),
        gainPerTenpai,
        lossPerNoten,
        nagashiPlayers: nagashiNames,
        drawType: normalizedDrawType
      },
      tenpaiPlayers: tenpaiNames,
      nagashiPlayers: nagashiNames,
      scoreChanges,
      finalScores,
      playerSnapshots,
      riichiPlayers: riichiNames,
      createdAt: new Date().toISOString()
    };
  },

  advanceRound({ players, gameState, dealerIndex, dealerContinuation, resultType = 'win', hasNagashiMangan = false }) {
    const app = getApp();
    const gameSettings = app.globalData.gameSettings || { type: 'tonpuu', tobu: false };
    const windOrder = ['east', 'south', 'west', 'north'];

    let newGameState = { ...gameState };
    let newDealerIndex = dealerIndex;
    let isGameOver = app.globalData.isGameOver || false;

    if (resultType === 'draw') {
      // 流局满贯时不增加本场数
      if (!hasNagashiMangan) {
        newGameState.honba = (newGameState.honba || 0) + 1;
      }
      if (!dealerContinuation) {
        newGameState.round = (newGameState.round || 1) + 1;
        newDealerIndex = (dealerIndex + 1) % players.length;

        if (newGameState.round > 4) {
          const nextStateBeforeReset = {
            ...newGameState,
            round: newGameState.round,
            wind: newGameState.wind
          };

          if (this.checkGameOver(players, nextStateBeforeReset, gameSettings)) {
            isGameOver = true;
            newGameState = nextStateBeforeReset;
          } else {
            newGameState.round = 1;
            const currentWindIndex = windOrder.indexOf(newGameState.wind);
            if (currentWindIndex >= 0 && currentWindIndex < windOrder.length - 1) {
              newGameState.wind = windOrder[currentWindIndex + 1];
            }
          }
        }
      }
    } else if (dealerContinuation) {
      newGameState.honba = (newGameState.honba || 0) + 1;
    } else {
      newGameState.honba = 0;
      newGameState.round = (newGameState.round || 1) + 1;
      newDealerIndex = (dealerIndex + 1) % players.length;

      if (newGameState.round > 4) {
        const nextStateBeforeReset = {
          ...newGameState,
          round: newGameState.round,
          wind: newGameState.wind
        };

        if (this.checkGameOver(players, nextStateBeforeReset, gameSettings)) {
          isGameOver = true;
          newGameState = nextStateBeforeReset;
        } else {
          newGameState.round = 1;
          const currentWindIndex = windOrder.indexOf(newGameState.wind);
          if (currentWindIndex >= 0 && currentWindIndex < windOrder.length - 1) {
            newGameState.wind = windOrder[currentWindIndex + 1];
          }
        }
      }
    }

    if (!isGameOver) {
      if (this.checkGameOver(players, newGameState, gameSettings)) {
        isGameOver = true;
      }
    }

    const updatedPlayers = players.map((p, idx) => ({
      ...p,
      wind: ['东', '南', '西', '北'][(idx - newDealerIndex + 4) % 4]
    }));

    return {
      players: updatedPlayers,
      gameState: newGameState,
      currentDealerIndex: newDealerIndex,
      isGameOver
    };
  },

  checkGameOver(players, nextState, gameSettings) {
    if (!nextState) return false;
    if (gameSettings.tobu && players.some(p => p.score < 0)) {
      return true;
    }

    const wind = nextState.wind;
    const round = nextState.round || 1;

    if (gameSettings.type === 'tonpuu' && wind === 'south') {
      return true;
    }
    if (gameSettings.type === 'hanchan' && wind === 'west') {
      return true;
    }
    if (gameSettings.type === 'yonchan') {
      if (wind === 'north' && round > 4) {
        return true;
      }
    }

    return false;
  },

  onGameOverViewHistory() {
    this.setData({ showGameOverDialog: false });
    this.onOpenHistory();
  },

  onGameOverClose() {
    this.setData({ showGameOverDialog: false });
  },

  onOpenGameOverDialog() {
    if (!this.data.isGameOver) {
      wx.showToast({ title: '对局未结束', icon: 'none' });
      return;
    }
    this.setData({ showGameOverDialog: true });
  }
});