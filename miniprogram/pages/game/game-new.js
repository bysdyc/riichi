// pages/game/game.js - 完全重写版本
// 严格按照原HTML (dmvan.html) 的架构实现

const mahjong = require('../../utils/mahjong.js');
const yakuAnalyzer = require('../../utils/yaku-analyzer.js');

Page({
  data: {
    // ==================== 游戏基础数据 ====================
    gameSettings: null,
    players: [],
    gameState: {
      wind: 'east', // 'east'|'south'|'west'|'north'
      round: 1,
      honba: 0,
      riichiSticks: 0
    },
    currentDealerIndex: 0,
    roundHistory: [],
    isGameOver: false,
    
    // ==================== UI状态 ====================
    showWinDialog: false,
    showDrawDialog: false,
    showTileSelectorDialog: false,
    showMeldDialog: false,
    showHistory: false,
    
    // ==================== 输入模式 (4种) ====================
    // 'auto': 自动分析模式 - 手牌输入 + 自动分析役种
    // 'manual': 手动役种模式 - 手牌输入 + 手动选择役种
    // 'expert': 老手快速模式 - 直接输入番符
    // 'multi': 多人和牌模式 - 特殊UI和逻辑
    inputMode: 'expert',
    
    // ==================== 和牌基础数据 ====================
    winnerIndex: null,
    loserIndex: null,
    isTsumo: true,
    
    // ==================== Expert模式 (老手快速输入) ====================
    expertHan: 1,
    expertFu: 30,
    
    // ==================== 手牌输入相关 (Auto + Manual模式) ====================
    handTiles: [],        // 手牌数组 ['1m', '2m', '3m', ...]
    melds: [],            // 副露数组 [{ type: 'shuntsu'|'pon'|'minkan'|'ankan', tiles: [...] }]
    winTile: null,        // 和牌
    
    // ==================== 状况役 ====================
    isRiichi: false,      // 立直
    isIppatsu: false,     // 一发
    isDoubleRiichi: false, // 双立直
    isTenhou: false,      // 天和
    isChiihou: false,     // 地和
    isRenhou: false,      // 人和
    isHaitei: false,      // 海底捞月
    isHoutei: false,      // 河底摸鱼
    isRinshan: false,     // 岭上开花
    isChankan: false,     // 抢杠
    yakuExpanded: false,  // 状况役是否展开 (默认折叠)
    
    // ==================== 宝牌 ====================
    dora: 0,              // 表宝牌
    uraDora: 0,           // 里宝牌 (需要立直)
    redDora: 0,           // 红宝牌
    maxRedDora: 0,        // 最大红宝数 (根据手牌自动计算)
    
    // ==================== Auto模式 (自动分析) ====================
    analysisResult: null, // 分析结果 { yaku: [], han: 0, fu: 0 }
    analysisError: null,  // 分析错误信息
    
    // ==================== Manual模式 (手动役种选择) ====================
    manualYakuList: [],   // 已选择的役种ID数组
    manualFu: 40,         // 手动模式的符数
    manualYakuConflict: '', // 役种冲突警告
    manualTotalHan: 0,    // 手动模式的总番数
    
    // ==================== 所有役种列表 (用于手动选择) ====================
    allYakuList: [
      // 役满
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
      { id: 'tenhou', name: '天和', han: 13, category: 'yakuman' },
      { id: 'chiihou', name: '地和', han: 13, category: 'yakuman' },
      { id: 'renhou', name: '人和', han: 13, category: 'yakuman' },
      
      // 6番
      { id: 'chinitsu', name: '清一色', han: 6, hanNaki: 5, category: '6han' },
      
      // 3番
      { id: 'honitsu', name: '混一色', han: 3, hanNaki: 2, category: '3han' },
      { id: 'junchan', name: '纯全带幺九', han: 3, hanNaki: 2, category: '3han' },
      { id: 'ryanpeikou', name: '两杯口', han: 3, category: '3han' },
      
      // 2番
      { id: 'chiitoitsu', name: '七对子', han: 2, category: '2han' },
      { id: 'toitoi', name: '对对和', han: 2, category: '2han' },
      { id: 'sanankou', name: '三暗刻', han: 2, category: '2han' },
      { id: 'honroutou', name: '混老头', han: 2, category: '2han' },
      { id: 'shousangen', name: '小三元', han: 2, category: '2han' },
      { id: 'sanshoku_doujun', name: '三色同顺', han: 2, hanNaki: 1, category: '2han' },
      { id: 'sanshoku_doukou', name: '三色同刻', han: 2, category: '2han' },
      { id: 'ittsu', name: '一气通贯', han: 2, hanNaki: 1, category: '2han' },
      { id: 'chanta', name: '混全带幺九', han: 2, hanNaki: 1, category: '2han' },
      { id: 'double_riichi', name: '双立直', han: 2, category: '2han' },
      
      // 1番
      { id: 'riichi', name: '立直', han: 1, category: '1han' },
      { id: 'ippatsu', name: '一发', han: 1, category: '1han' },
      { id: 'tsumo', name: '门前清自摸和', han: 1, category: '1han' },
      { id: 'yakuhai_haku', name: '役牌:白', han: 1, category: '1han' },
      { id: 'yakuhai_hatsu', name: '役牌:发', han: 1, category: '1han' },
      { id: 'yakuhai_chun', name: '役牌:中', han: 1, category: '1han' },
      { id: 'yakuhai_ton', name: '役牌:东', han: 1, category: '1han' },
      { id: 'yakuhai_nan', name: '役牌:南', han: 1, category: '1han' },
      { id: 'yakuhai_shaa', name: '役牌:西', han: 1, category: '1han' },
      { id: 'yakuhai_pei', name: '役牌:北', han: 1, category: '1han' },
      { id: 'pinfu', name: '平和', han: 1, category: '1han' },
      { id: 'iipeikou', name: '一杯口', han: 1, category: '1han' },
      { id: 'tanyao', name: '断幺九', han: 1, category: '1han' },
      { id: 'haitei', name: '海底捞月', han: 1, category: '1han' },
      { id: 'houtei', name: '河底摸鱼', han: 1, category: '1han' },
      { id: 'rinshan', name: '岭上开花', han: 1, category: '1han' },
      { id: 'chankan', name: '抢杠', han: 1, category: '1han' }
    ],
    
    // ==================== 牌选择器 ====================
    tileSelectorTitle: '选择牌',
    tileSelectorMax: 13,
    tileSelectorInitial: [],
    tileSelectorType: 'hand', // 'hand'|'win'|'meld'
    
    // ==================== 副露相关 ====================
    meldTypes: [
      { id: 'shuntsu', name: '顺子' },
      { id: 'pon', name: '碰' },
      { id: 'minkan', name: '明杠' },
      { id: 'ankan', name: '暗杠' }
    ],
    selectedMeldType: 'shuntsu',
    meldTileCount: {
      'shuntsu': 3,
      'pon': 3,
      'minkan': 4,
      'ankan': 4
    },
    
    // ==================== 多人和牌相关 ====================
    multiLoserIndex: null,
    multiWinners: [false, false, false, false],
    multiHanFu: [
      { han: 1, fu: 30 },
      { han: 1, fu: 30 },
      { han: 1, fu: 30 },
      { han: 1, fu: 30 }
    ],
    
    // ==================== 流局相关 ====================
    tenpaiedPlayers: [false, false, false, false],
    showNagashiMangan: false,  // 是否显示流局满贯选项
    nagashiManganPlayers: [false, false, false, false], // 流局满贯的玩家
    
    // ==================== 点数预览 ====================
    pointsPreview: '',
    
    // ==================== 场风文本 ====================
    windText: '東',
    
    // ==================== 牌显示映射 ====================
    tileDisplayMap: {
      '1m': '1万', '2m': '2万', '3m': '3万', '4m': '4万', '5m': '5万',
      '6m': '6万', '7m': '7万', '8m': '8万', '9m': '9万',
      '1p': '1筒', '2p': '2筒', '3p': '3筒', '4p': '4筒', '5p': '5筒',
      '6p': '6筒', '7p': '7筒', '8p': '8筒', '9p': '9筒',
      '1s': '1索', '2s': '2索', '3s': '3索', '4s': '4索', '5s': '5索',
      '6s': '6索', '7s': '7索', '8s': '8索', '9s': '9索',
      '1z': '东', '2z': '南', '3z': '西', '4z': '北',
      '5z': '白', '6z': '发', '7z': '中'
    },
    
    // ==================== 最终排名 ====================
    finalRanking: []
  },

  // ==================== 生命周期 ====================
  
  onLoad() {
    this.loadGameState();
  },

  // ==================== 游戏状态管理 ====================
  
  // 加载游戏状态
  loadGameState() {
    try {
      const savedState = wx.getStorageSync('riichi_game_state');
      if (savedState) {
        const { gameSettings, players, gameState, currentDealerIndex, roundHistory, isGameOver } = savedState;
        
        // 更新庄家标记
        players.forEach((p, i) => {
          p.isDealer = (i === currentDealerIndex);
        });
        
        this.setData({
          gameSettings,
          players,
          gameState,
          currentDealerIndex,
          roundHistory,
          isGameOver,
          windText: this.getWindText(gameState.wind)
        });

        if (isGameOver) {
          this.showGameOverDialog();
        }
      } else {
        wx.showModal({
          title: '错误',
          content: '未找到游戏数据，请返回首页重新开始',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    } catch (e) {
      console.error('加载游戏状态失败', e);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 保存游戏状态
  saveGameState() {
    const state = {
      gameSettings: this.data.gameSettings,
      players: this.data.players,
      gameState: this.data.gameState,
      currentDealerIndex: this.data.currentDealerIndex,
      roundHistory: this.data.roundHistory,
      isGameOver: this.data.isGameOver
    };
    wx.setStorageSync('riichi_game_state', state);
  },

  // 获取场风文本
  getWindText(wind) {
    const windMap = {
      'east': '東',
      'south': '南',
      'west': '西',
      'north': '北'
    };
    return windMap[wind] || '東';
  },

  // ==================== 输入模式切换 ====================
  
  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    
    // 切换模式时重置相关数据
    const resetData = {
      inputMode: mode,
      analysisResult: null,
      analysisError: null,
      manualYakuList: [],
      manualYakuConflict: '',
      manualTotalHan: 0,
      pointsPreview: ''
    };
    
    if (mode === 'expert') {
      // 老手模式：清空手牌相关数据
      resetData.handTiles = [];
      resetData.melds = [];
      resetData.winTile = null;
      resetData.expertHan = 1;
      resetData.expertFu = 30;
    } else if (mode === 'multi') {
      // 多人和牌模式：重置多人和牌数据
      resetData.multiLoserIndex = null;
      resetData.multiWinners = [false, false, false, false];
      resetData.multiHanFu = [
        { han: 1, fu: 30 },
        { han: 1, fu: 30 },
        { han: 1, fu: 30 },
        { han: 1, fu: 30 }
      ];
    } else if (mode === 'auto' || mode === 'manual') {
      // 自动分析/手动役种模式：保留手牌数据
      // 重置番符
      resetData.expertHan = 1;
      resetData.expertFu = 30;
    }
    
    this.setData(resetData);
  },

  // ==================== 未完待续 ====================
  // 由于代码量太大，将在下一个文件中继续...
  
})
