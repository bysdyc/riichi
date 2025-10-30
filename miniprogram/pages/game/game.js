// pages/game/game.js
const mahjong = require('../../utils/mahjong.js');
const yakuAnalyzer = require('../../utils/yaku-analyzer.js');

Page({
  data: {
    gameSettings: null,
    players: [],
    gameState: {
      wind: 'east',
      round: 1,
      honba: 0,
      riichiSticks: 0
    },
    currentDealerIndex: 0,
    roundHistory: [],
    isGameOver: false,
    
    // UI状态
    showWinDialog: false,
    showDrawDialog: false,
    showTileSelectorDialog: false,
    showMeldDialog: false,
    showHistory: false,
    
    // 和牌输入模式: 'auto'(自动分析), 'manual'(手动役种), 'expert'(老手番符), 'multi'(多人和牌)
    inputMode: 'expert',
    
    // 和牌相关
    winnerIndex: null,
    loserIndex: null,
    isTsumo: true,
    
    // Expert模式 (老手快速输入)
    expertHan: 1,
    expertFu: 30,
    
    // 宝牌
    dora: 0,
    uraDora: 0,
    redDora: 0,
    maxRedDora: 0,  // 最大红宝数（根据手牌自动计算）
    pointsPreview: '',
    
    // 手牌输入相关 (Auto + Manual模式)
    handTiles: [],
    melds: [],
    winTile: null,
    
    // 状况役
    isRiichi: false,
    isIppatsu: false,
    isDoubleRiichi: false,
    isTenhou: false,      // 天和
    isChiihou: false,     // 地和
    isRenhou: false,      // 人和
    isHaitei: false,
    isHoutei: false,
    isRinshan: false,
    isChankan: false,
    yakuExpanded: false,  // 状况役是否展开（默认折叠）
    
    // Auto模式 (自动分析)
    analysisResult: null,
    analysisError: null,
    
    // Manual模式 (手动役种选择)
    manualYakuList: [],      // 已选择的役种ID数组
    manualFu: 40,            // 手动模式的符数
    manualYakuConflict: '',  // 役种冲突警告
    manualTotalHan: 0,       // 手动模式的总番数
    
    // 牌选择器
    tileSelectorTitle: '选择牌',
    tileSelectorMax: 13,
    tileSelectorInitial: [],
    tileSelectorType: 'hand', // 'hand', 'win', 'meld'
    
    // 副露相关
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
    
    // 所有役种列表 (用于手动选择)
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
    
    // 多人和牌相关
    multiLoserIndex: null,
    multiWinners: [false, false, false, false],
    multiHanFu: [
      { han: 1, fu: 30 },
      { han: 1, fu: 30 },
      { han: 1, fu: 30 },
      { han: 1, fu: 30 }
    ],
    
    // 流局相关
    tenpaiedPlayers: [false, false, false, false],
    showNagashiMangan: false,  // 是否显示流局满贯选项
    nagashiManganPlayers: [false, false, false, false],  // 流局满贯的玩家
    
    // 最终排名
    finalRanking: [],
    
    // 场风文本
    windText: '東',
    
    // 牌显示映射
    tileDisplayMap: {
      '1m': '1万', '2m': '2万', '3m': '3万', '4m': '4万', '5m': '5万',
      '6m': '6万', '7m': '7万', '8m': '8万', '9m': '9万',
      '1p': '1筒', '2p': '2筒', '3p': '3筒', '4p': '4筒', '5p': '5筒',
      '6p': '6筒', '7p': '7筒', '8p': '8筒', '9p': '9筒',
      '1s': '1索', '2s': '2索', '3s': '3索', '4s': '4索', '5s': '5索',
      '6s': '6索', '7s': '7索', '8s': '8索', '9s': '9索',
      '1z': '东', '2z': '南', '3z': '西', '4z': '北',
      '5z': '白', '6z': '发', '7z': '中'
    }
  },

  onLoad() {
    this.loadGameState();
  },

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
  
  // 切换输入模式
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
      pointsPreview: '',
      winnerIndex: null,
      loserIndex: null,
      isTsumo: true
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
    }
    
    this.setData(resetData);
    
    wx.showToast({
      title: mode === 'auto' ? '自动分析模式' : 
             mode === 'manual' ? '手动役种模式' :
             mode === 'expert' ? '老手快速模式' : '多人和牌模式',
      icon: 'none',
      duration: 1500
    });
  },

  // ==================== 副露管理 ====================
  
  // 删除单个副露
  removeMeld(e) {
    const index = e.currentTarget.dataset.index;
    const melds = [...this.data.melds];
    melds.splice(index, 1);
    this.setData({ 
      melds,
      analysisResult: null,
      analysisError: null
    });
    
    wx.showToast({
      title: '副露已删除',
      icon: 'success',
      duration: 1500
    });
  },

  // 清空所有副露
  clearMelds() {
    this.setData({ 
      melds: [],
      analysisResult: null,
      analysisError: null
    }, () => {
      this.updateRedDora();  // 清空副露后更新红宝
    });
    
    wx.showToast({
      title: '副露已清空',
      icon: 'success',
      duration: 1500
    });
  },

  // 删除手牌
  removeHandTile(e) {
    const index = e.currentTarget.dataset.index;
    const handTiles = [...this.data.handTiles];
    handTiles.splice(index, 1);
    this.setData({ 
      handTiles,
      analysisResult: null,
      analysisError: null
    }, () => {
      this.updateRedDora();  // 删除手牌后更新红宝
    });
  },

  // ==================== 状况役交互 ====================
  
  // 切换状况役展开/折叠
  toggleYakuExpanded() {
    this.setData({
      yakuExpanded: !this.data.yakuExpanded
    });
  },

  // 切换状况役（带互斥检查）
  toggleYakuWithCheck(e) {
    const yakuType = e.currentTarget.dataset.type;
    const currentValue = this.data[yakuType];
    const newValue = !currentValue;
    
    // 互斥关系检查
    if (newValue) {
      if (yakuType === 'isDoubleRiichi' && this.data.isRiichi) {
        this.setData({ isRiichi: false });
      } else if (yakuType === 'isRiichi' && this.data.isDoubleRiichi) {
        this.setData({ isDoubleRiichi: false });
      } else if (yakuType === 'isHaitei' && this.data.isHoutei) {
        this.setData({ isHoutei: false });
      } else if (yakuType === 'isHoutei' && this.data.isHaitei) {
        this.setData({ isHaitei: false });
      } else if (yakuType === 'isRinshan') {
        this.setData({ 
          isHaitei: false,
          isHoutei: false
        });
      } else if (yakuType === 'isTenhou' && (this.data.isChiihou || this.data.isRenhou)) {
        this.setData({ isChiihou: false, isRenhou: false });
      } else if (yakuType === 'isChiihou' && (this.data.isTenhou || this.data.isRenhou)) {
        this.setData({ isTenhou: false, isRenhou: false });
      } else if (yakuType === 'isRenhou' && (this.data.isTenhou || this.data.isChiihou)) {
        this.setData({ isTenhou: false, isChiihou: false });
      }
      
      // 一发需要立直
      if (yakuType === 'isIppatsu' && !this.data.isRiichi && !this.data.isDoubleRiichi) {
        wx.showToast({
          title: '一发需要立直或双立直',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({ [yakuType]: newValue });
  },

  // ==================== 流局满贯 ====================
  
  // 切换流局满贯选项
  toggleNagashiMangan() {
    this.setData({
      showNagashiMangan: !this.data.showNagashiMangan
    });
  },

  // 切换流局满贯玩家
  toggleNagashiManganPlayer(e) {
    const index = e.currentTarget.dataset.index;
    const key = `nagashiManganPlayers[${index}]`;
    this.setData({
      [key]: !this.data.nagashiManganPlayers[index]
    });
  },

  // ==================== 手动役种选择 ====================

  // 手动役种选择变化
  onManualYakuChange(e) {
    const { selectedYaku, totalHan, hasConflict } = e.detail;
    this.setData({
      manualYakuList: selectedYaku,
      manualTotalHan: totalHan,
      manualYakuConflict: hasConflict
    }, () => {
      this.updateManualPointsPreview();
    });
  },

  // 手动模式符数输入
  inputManualFu(e) {
    const manualFu = parseInt(e.detail.value) || 30;
    this.setData({ manualFu: Math.max(20, manualFu) }, () => {
      this.updateManualPointsPreview();
    });
  },

  // 更新手动模式点数预览
  updateManualPointsPreview() {
    const { manualTotalHan, manualFu, dora, uraDora, redDora, winner, dealer } = this.data;
    
    if (!winner) return;

    const finalHan = manualTotalHan + dora + uraDora + redDora;
    const finalFu = manualFu;

    if (finalHan === 0) {
      this.setData({ pointsPreview: '' });
      return;
    }

    try {
      const mahjong = require('../../utils/mahjong.js');
      const isDealer = winner === dealer;
      const points = mahjong.calculatePoints(finalHan, finalFu, isDealer, false);
      
      if (points) {
        this.setData({
          pointsPreview: `${points.name} ${isDealer ? points.dealer : points.nonDealer}点`
        });
      }
    } catch (error) {
      console.error('计算点数预览失败:', error);
      this.setData({ pointsPreview: '' });
    }
  },

  // ==================== 红宝自动计算 ====================

  // 计算红宝数量（统计手牌和副露中的红五）
  calculateRedDora() {
    const { handTiles, melds, winTile } = this.data;
    let redCount = 0;
    
    // 统计手牌中的红五
    handTiles.forEach(tile => {
      if (tile === '5m-red' || tile === '5p-red' || tile === '5s-red') {
        redCount++;
      }
    });
    
    // 统计和牌中的红五
    if (winTile && (winTile === '5m-red' || winTile === '5p-red' || winTile === '5s-red')) {
      redCount++;
    }
    
    // 统计副露中的红五
    melds.forEach(meld => {
      meld.tiles.forEach(tile => {
        if (tile === '5m-red' || tile === '5p-red' || tile === '5s-red') {
          redCount++;
        }
      });
    });
    
    // 更新红宝数和最大红宝数
    this.setData({ 
      redDora: redCount,
      maxRedDora: redCount
    });
    
    return redCount;
  },

  // 更新红宝（在手牌/副露/和牌变化时调用）
  updateRedDora() {
    // 只在Auto和Manual模式下自动计算
    if (this.data.inputMode === 'auto' || this.data.inputMode === 'manual') {
      this.calculateRedDora();
      
      // 更新点数预览
      if (this.data.inputMode === 'manual') {
        this.updateManualPointsPreview();
      }
    }
  },

  // ==================== 原有方法继续 ====================

  // 切换立直状态
  toggleRiichi(e) {
    const index = e.currentTarget.dataset.index;
    const players = this.data.players;
    const wasRiichi = players[index].isRiichi;
    
    players[index].isRiichi = !wasRiichi;
    
    // 更新立直棒数量
    const gameState = this.data.gameState;
    if (!wasRiichi) {
      gameState.riichiSticks += 1;
      players[index].score -= 1000; // 扣除立直棒
    } else {
      gameState.riichiSticks -= 1;
      players[index].score += 1000; // 退还立直棒
    }
    
    this.setData({
      players,
      gameState
    });
    
    this.saveGameState();
  },

  // 显示和牌对话框
  showWinDialog() {
    this.setData({
      showWinDialog: true,
      inputMode: 'manual',
      winnerIndex: null,
      loserIndex: null,
      isTsumo: true,
      han: 1,
      fu: 30,
      dora: 0,
      uraDora: 0,
      redDora: 0,
      pointsPreview: '',
      handTiles: [],
      melds: [],
      winTile: null,
      analysisResult: null,
      analysisError: null,
      multiLoserIndex: null,
      multiWinners: [false, false, false, false],
      multiHanFu: [
        { han: 1, fu: 30 },
        { han: 1, fu: 30 },
        { han: 1, fu: 30 },
        { han: 1, fu: 30 }
      ]
    });
  },

  // 切换输入模式
  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      inputMode: mode,
      analysisResult: null,
      analysisError: null
    });
  },

  // 获取牌的显示名称
  getTileDisplay(tile) {
    return this.data.tileDisplayMap[tile] || tile;
  },

  // 显示牌选择器
  showTileSelector(e) {
    const type = e.currentTarget.dataset.type;
    let title = '选择牌';
    let maxTiles = 13;
    
    if (type === 'hand') {
      title = '选择手牌';
      maxTiles = 13 - this.data.melds.length * 3;
    } else if (type === 'win') {
      title = '选择和牌';
      maxTiles = 1;
    }
    
    this.setData({
      showTileSelectorDialog: true,
      tileSelectorTitle: title,
      tileSelectorMax: maxTiles,
      tileSelectorType: type,
      tileSelectorInitial: type === 'hand' ? this.data.handTiles : []
    });
  },

  // 关闭牌选择器
  closeTileSelector() {
    this.setData({
      showTileSelectorDialog: false
    });
  },

  // 牌选择确认
  onTileSelected(e) {
    const tiles = e.detail.tiles;
    const type = this.data.tileSelectorType;
    
    if (type === 'hand') {
      this.setData({
        handTiles: tiles,
        showTileSelectorDialog: false
      }, () => {
        this.updateRedDora();  // 手牌变化后更新红宝
      });
    } else if (type === 'win') {
      this.setData({
        winTile: tiles[0],
        showTileSelectorDialog: false
      }, () => {
        this.updateRedDora();  // 和牌变化后更新红宝
      });
    }
  },

  // 牌选择变化
  onTileChange(e) {
    // 可以用于实时预览
  },

  // 清除和牌
  clearWinTile() {
    this.setData({
      winTile: null
    });
  },

  // 显示副露对话框
  showMeldDialog() {
    this.setData({
      showMeldDialog: true,
      selectedMeldType: 'shuntsu'
    });
  },

  // 关闭副露对话框
  closeMeldDialog() {
    this.setData({
      showMeldDialog: false
    });
  },

  // 选择副露类型
  selectMeldType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedMeldType: type
    });
  },

  // 确认添加副露
  confirmMeld(e) {
    const tiles = e.detail.tiles;
    const type = this.data.selectedMeldType;
    
    // 验证副露
    if (type === 'shuntsu' || type === 'pon') {
      if (tiles.length !== 3) {
        wx.showToast({
          title: '需要3张牌',
          icon: 'none'
        });
        return;
      }
    } else if (type === 'minkan' || type === 'ankan') {
      if (tiles.length !== 4) {
        wx.showToast({
          title: '需要4张牌',
          icon: 'none'
        });
        return;
      }
    }
    
    const melds = [...this.data.melds];
    const typeNames = {
      'shuntsu': '顺子',
      'pon': '碰',
      'minkan': '明杠',
      'ankan': '暗杠'
    };
    
    melds.push({
      type: type,
      typeName: typeNames[type],
      tiles: tiles
    });
    
    this.setData({
      melds: melds,
      showMeldDialog: false
    }, () => {
      this.updateRedDora();  // 副露变化后更新红宝
    });
  },

  // 删除副露
  removeMeld(e) {
    const index = e.currentTarget.dataset.index;
    const melds = [...this.data.melds];
    melds.splice(index, 1);
    this.setData({
      melds: melds
    });
  },

  // 状况役变化
  conditionChange(e) {
    const values = e.detail.value;
    this.setData({
      isRiichi: values.includes('riichi'),
      isIppatsu: values.includes('ippatsu'),
      isDoubleRiichi: values.includes('doubleRiichi'),
      isHaitei: values.includes('haitei'),
      isHoutei: values.includes('houtei'),
      isRinshan: values.includes('rinshan'),
      isChankan: values.includes('chankan')
    });
  },

  // 分析手牌
  analyzeHand() {
    const { handTiles, melds, winTile, isTsumo, isRiichi, isIppatsu, isDoubleRiichi,
            isHaitei, isHoutei, isRinshan, isChankan, winnerIndex, gameState } = this.data;
    
    if (!winTile) {
      this.setData({
        analysisError: '请选择和牌'
      });
      return;
    }
    
    // 构建14张牌（手牌+和牌）
    const allTiles = [...handTiles, winTile];
    
    if (allTiles.length + melds.length * 3 !== 14) {
      this.setData({
        analysisError: `牌数不正确：需要14张，当前${allTiles.length + melds.length * 3}张`
      });
      return;
    }
    
    // 获取玩家风和场风
    const playerWind = winnerIndex !== null ? this.data.players[winnerIndex].wind : '東';
    const windMap = { 'east': '東', 'south': '南', 'west': '西', 'north': '北' };
    const roundWind = windMap[gameState.wind];
    
    // 构建分析上下文
    const context = {
      isTsumo,
      isRiichi,
      isIppatsu,
      isDoubleRiichi,
      isTenhou: false,
      isChiihou: false,
      isRenhou: false,
      isHaitei,
      isHoutei,
      isRinshan,
      isChankan,
      isMenzen: melds.length === 0 || melds.every(m => m.type === 'ankan'),
      playerWind,
      roundWind,
      melds: melds
    };
    
    // 调用分析引擎
    const result = yakuAnalyzer.analyzeHand(allTiles, winTile, context);
    
    if (result.error) {
      this.setData({
        analysisError: result.error,
        analysisResult: null
      });
      return;
    }
    
    // 显示结果
    this.setData({
      analysisResult: {
        yaku: result.yaku.join('、'),
        han: result.han,
        fu: result.fu
      },
      analysisError: null,
      han: result.han,
      fu: result.fu
    });
    
    wx.showToast({
      title: '分析完成',
      icon: 'success'
    });
  },

  // 多人和牌 - 选择放铳者
  selectMultiLoser(e) {
    const index = e.currentTarget.dataset.index;
    
    // 如果之前选中的和牌者就是这个放铳者，取消选中
    const multiWinners = [...this.data.multiWinners];
    if (multiWinners[index]) {
      multiWinners[index] = false;
    }
    
    this.setData({
      multiLoserIndex: index,
      multiWinners: multiWinners
    });
  },

  // 多人和牌 - 切换和牌者
  toggleMultiWinner(e) {
    const index = e.currentTarget.dataset.index;
    const multiWinners = [...this.data.multiWinners];
    multiWinners[index] = !multiWinners[index];
    
    this.setData({
      multiWinners: multiWinners
    });
  },

  // 多人和牌 - 输入番数
  inputMultiHan(e) {
    const index = e.currentTarget.dataset.index;
    const han = parseInt(e.detail.value) || 1;
    const multiHanFu = [...this.data.multiHanFu];
    multiHanFu[index].han = Math.max(1, han);
    
    this.setData({
      multiHanFu: multiHanFu
    });
  },

  // 多人和牌 - 输入符数
  inputMultiFu(e) {
    const index = e.currentTarget.dataset.index;
    const fu = parseInt(e.detail.value) || 30;
    const multiHanFu = [...this.data.multiHanFu];
    multiHanFu[index].fu = Math.max(20, fu);
    
    this.setData({
      multiHanFu: multiHanFu
    });
  },

  // 关闭和牌对话框
  closeWinDialog() {
    this.setData({
      showWinDialog: false
    });
  },

  // 设置和牌类型
  setWinType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      isTsumo: type === 'tsumo',
      loserIndex: null
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 选择和牌者
  selectWinner(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      winnerIndex: index
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 选择放铳者
  selectLoser(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      loserIndex: index
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 输入番数
  // ==================== Expert模式输入 ====================
  
  // 输入老手模式番数
  inputExpertHan(e) {
    const expertHan = parseInt(e.detail.value) || 1;
    this.setData({
      expertHan: Math.max(1, expertHan)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 选择老手模式符数
  selectExpertFu(e) {
    const values = [20,25,30,40,50,60,70,80,90,100,110];
    const expertFu = values[e.detail.value] || 30;
    this.setData({
      expertFu
    }, () => {
      this.updatePointsPreview();
    });
  },

  // ==================== 原有输入方法（兼容） ====================
  
  inputHan(e) {
    const han = parseInt(e.detail.value) || 1;
    this.setData({
      han: Math.max(1, han)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 输入符数
  inputFu(e) {
    const fu = parseInt(e.detail.value) || 30;
    this.setData({
      fu: Math.max(20, fu)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 输入宝牌
  inputDora(e) {
    const dora = parseInt(e.detail.value) || 0;
    this.setData({
      dora: Math.max(0, dora)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 输入里宝
  inputUraDora(e) {
    const uraDora = parseInt(e.detail.value) || 0;
    this.setData({
      uraDora: Math.max(0, uraDora)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 输入红宝
  inputRedDora(e) {
    const redDora = parseInt(e.detail.value) || 0;
    this.setData({
      redDora: Math.max(0, redDora)
    }, () => {
      this.updatePointsPreview();
    });
  },

  // 更新点数预览
  updatePointsPreview() {
    const { inputMode, winnerIndex, isTsumo, expertHan, expertFu, han, fu, dora, uraDora, redDora } = this.data;
    
    if (winnerIndex === null) {
      this.setData({ pointsPreview: '' });
      return;
    }

    // 根据模式使用不同的番符
    let finalHan, finalFu;
    if (inputMode === 'expert') {
      finalHan = expertHan + dora + uraDora + redDora;
      finalFu = expertFu;
    } else {
      finalHan = han + dora + uraDora + redDora;
      finalFu = fu;
    }
    
    const isDealer = (winnerIndex === this.data.currentDealerIndex);
    
    const payment = mahjong.calculatePoints(finalHan, finalFu, isDealer, isTsumo);
    
    let previewText = '';
    if (isTsumo) {
      previewText = `和牌者获得：${payment.winner}点`;
    } else {
      previewText = `和牌者获得：${payment.winner}点`;
    }
    
    this.setData({
      pointsPreview: previewText
    });
  },

  // 确认和牌
  confirmWin() {
    const { inputMode } = this.data;
    
    if (inputMode === 'multi') {
      this.confirmMultiWin();
      return;
    }
    
    const { winnerIndex, loserIndex, isTsumo, han, fu, dora, uraDora, redDora, players, gameState, currentDealerIndex } = this.data;
    
    if (winnerIndex === null) {
      wx.showToast({
        title: '请选择和牌者',
        icon: 'none'
      });
      return;
    }

    if (!isTsumo && loserIndex === null) {
      wx.showToast({
        title: '请选择放铳者',
        icon: 'none'
      });
      return;
    }

    const totalHan = han + dora + uraDora + redDora;
    const isDealer = (winnerIndex === currentDealerIndex);
    
    const payment = mahjong.calculatePoints(totalHan, fu, isDealer, isTsumo);
    
    // 更新分数
    const newPlayers = JSON.parse(JSON.stringify(players));
    
    if (isTsumo) {
      // 自摸
      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) {
          newPlayers[i].score += payment.winner;
        } else if (i === currentDealerIndex && i !== winnerIndex) {
          newPlayers[i].score += payment.dealer;
        } else {
          newPlayers[i].score += payment.nonDealer;
        }
      }
    } else {
      // 荣和
      newPlayers[winnerIndex].score += payment.winner;
      newPlayers[loserIndex].score += payment.loser;
    }

    // 和牌者收取立直棒
    newPlayers[winnerIndex].score += gameState.riichiSticks * 1000;
    newPlayers[winnerIndex].score += gameState.honba * 300;

    // 清除所有立直状态
    newPlayers.forEach(p => p.isRiichi = false);

    // 记录历史
    const roundHistory = [...this.data.roundHistory];
    roundHistory.push({
      type: 'win',
      wind: gameState.wind,
      round: gameState.round,
      honba: gameState.honba,
      winner: players[winnerIndex].name,
      loser: isTsumo ? '自摸' : players[loserIndex].name,
      han: totalHan,
      fu: fu,
      payment: isTsumo ? payment.winner : payment.winner
    });

    // 判断是否庄家胜利
    const dealerWon = (winnerIndex === currentDealerIndex);
    
    // 获取下一轮信息
    const nextRound = mahjong.getNextRound(gameState, dealerWon, currentDealerIndex);
    
    // 更新庄家标记
    newPlayers.forEach((p, i) => {
      p.isDealer = (i === nextRound.newDealerIndex);
    });

    // 检查游戏是否结束
    const gameEnd = mahjong.checkGameEnd(
      this.data.gameSettings,
      { wind: nextRound.wind, round: nextRound.round, honba: nextRound.honba },
      newPlayers,
      nextRound.newDealerIndex
    );

    this.setData({
      players: newPlayers,
      gameState: {
        wind: nextRound.wind,
        round: nextRound.round,
        honba: nextRound.honba,
        riichiSticks: 0
      },
      currentDealerIndex: nextRound.newDealerIndex,
      roundHistory,
      windText: this.getWindText(nextRound.wind),
      showWinDialog: false,
      isGameOver: gameEnd.ended
    });

    this.saveGameState();

    if (gameEnd.ended) {
      this.showGameOverDialog();
    } else {
      wx.showToast({
        title: '已记录',
        icon: 'success'
      });
    }
  },

  // 显示流局对话框
  showDrawDialog() {
    this.setData({
      showDrawDialog: true,
      tenpaiedPlayers: [false, false, false, false]
    });
  },

  // 关闭流局对话框
  closeDrawDialog() {
    this.setData({
      showDrawDialog: false,
      showNagashiMangan: false,
      nagashiManganPlayers: [false, false, false, false]
    });
  },

  // 切换听牌状态
  toggleTenpai(e) {
    const index = e.currentTarget.dataset.index;
    const tenpaiedPlayers = this.data.tenpaiedPlayers;
    tenpaiedPlayers[index] = !tenpaiedPlayers[index];
    this.setData({
      tenpaiedPlayers
    });
  },

  // 确认流局
  confirmDraw() {
    const { tenpaiedPlayers, nagashiManganPlayers, players, gameState, currentDealerIndex } = this.data;
    
    // 检查是否有流局满贯
    const hasNagashiMangan = nagashiManganPlayers.some(p => p);
    let payment = [0, 0, 0, 0];
    
    if (hasNagashiMangan) {
      // 流局满贯处理（满贯点数：庄家12000点，闲家8000点）
      nagashiManganPlayers.forEach((isNagashi, index) => {
        if (isNagashi) {
          const isDealer = (index === currentDealerIndex);
          const manganPoints = isDealer ? 12000 : 8000;
          const lossPerPlayer = manganPoints / 3;
          
          // 获得满贯点数
          payment[index] += manganPoints;
          
          // 其他三家平分支付
          for (let i = 0; i < 4; i++) {
            if (i !== index) {
              payment[i] -= lossPerPlayer;
            }
          }
        }
      });
    } else {
      // 普通流局处理
      payment = mahjong.calculateDrawPayment(tenpaiedPlayers);
    }
    
    // 更新分数
    const newPlayers = JSON.parse(JSON.stringify(players));
    for (let i = 0; i < 4; i++) {
      newPlayers[i].score += payment[i];
    }

    // 清除所有立直状态（流局时立直棒不退还，留到下一局）
    newPlayers.forEach(p => p.isRiichi = false);

    // 记录历史
    const roundHistory = [...this.data.roundHistory];
    const historyEntry = {
      type: hasNagashiMangan ? 'nagashi-mangan' : 'draw',
      wind: gameState.wind,
      round: gameState.round,
      honba: gameState.honba
    };
    
    if (hasNagashiMangan) {
      historyEntry.nagashiPlayers = nagashiManganPlayers.map((nm, i) => nm ? players[i].name : null).filter(Boolean).join('、');
    } else {
      historyEntry.tenpai = tenpaiedPlayers.map((t, i) => t ? players[i].name : null).filter(Boolean).join('、') || '无人听牌';
    }
    
    roundHistory.push(historyEntry);

    // 判断庄家是否听牌（听牌则连庄）
    const dealerTenpai = tenpaiedPlayers[currentDealerIndex];
    
    // 获取下一轮信息
    const nextRound = mahjong.getNextRound(gameState, dealerTenpai, currentDealerIndex);
    
    // 更新庄家标记
    newPlayers.forEach((p, i) => {
      p.isDealer = (i === nextRound.newDealerIndex);
    });

    // 检查游戏是否结束
    const gameEnd = mahjong.checkGameEnd(
      this.data.gameSettings,
      { wind: nextRound.wind, round: nextRound.round, honba: nextRound.honba },
      newPlayers,
      nextRound.newDealerIndex
    );

    this.setData({
      players: newPlayers,
      gameState: {
        wind: nextRound.wind,
        round: nextRound.round,
        honba: nextRound.honba,
        riichiSticks: gameState.riichiSticks // 流局保留立直棒
      },
      currentDealerIndex: nextRound.newDealerIndex,
      roundHistory,
      windText: this.getWindText(nextRound.wind),
      showDrawDialog: false,
      isGameOver: gameEnd.ended
    });

    this.saveGameState();

    if (gameEnd.ended) {
      this.showGameOverDialog();
    } else {
      wx.showToast({
        title: '流局已记录',
        icon: 'success'
      });
    }
  },

  // 确认多人和牌
  confirmMultiWin() {
    const { multiLoserIndex, multiWinners, multiHanFu, players, gameState, currentDealerIndex } = this.data;
    
    if (multiLoserIndex === null) {
      wx.showToast({
        title: '请选择放铳者',
        icon: 'none'
      });
      return;
    }
    
    const winnerCount = multiWinners.filter(w => w).length;
    if (winnerCount < 2) {
      wx.showToast({
        title: '至少需要2位和牌者',
        icon: 'none'
      });
      return;
    }
    
    if (winnerCount > 3) {
      wx.showToast({
        title: '最多3位和牌者',
        icon: 'none'
      });
      return;
    }
    
    // 计算每位和牌者的得分
    const newPlayers = JSON.parse(JSON.stringify(players));
    let totalPayment = 0;
    const winnerDetails = [];
    
    for (let i = 0; i < 4; i++) {
      if (multiWinners[i]) {
        const { han, fu } = multiHanFu[i];
        const isDealer = (i === currentDealerIndex);
        
        // 三家和都是荣和
        const payment = mahjong.calculatePoints(han, fu, isDealer, false);
        
        newPlayers[i].score += payment.winner;
        totalPayment += payment.winner;
        
        winnerDetails.push({
          name: players[i].name,
          wind: players[i].wind,
          isDealer: isDealer,
          han: han,
          fu: fu,
          score: payment.winner
        });
      }
    }
    
    // 放铳者支付所有点数
    newPlayers[multiLoserIndex].score -= totalPayment;
    
    // 立直棒分配（平均分给所有和牌者）
    const riichiBonus = Math.floor(gameState.riichiSticks * 1000 / winnerCount);
    for (let i = 0; i < 4; i++) {
      if (multiWinners[i]) {
        newPlayers[i].score += riichiBonus;
      }
    }
    
    // 本场费也平均分配
    const honbaBonus = Math.floor(gameState.honba * 300 / winnerCount);
    for (let i = 0; i < 4; i++) {
      if (multiWinners[i]) {
        newPlayers[i].score += honbaBonus;
      }
    }
    
    // 清除所有立直状态
    newPlayers.forEach(p => p.isRiichi = false);
    
    // 记录历史
    const roundHistory = [...this.data.roundHistory];
    roundHistory.push({
      type: 'win',
      isMultiWin: true,
      multiWinCount: winnerCount,
      wind: gameState.wind,
      round: gameState.round,
      honba: gameState.honba,
      winner: winnerDetails.map(w => w.name).join('、'),
      loser: players[multiLoserIndex].name,
      winnersDetails: winnerDetails,
      score: totalPayment,
      riichiBonus: riichiBonus * winnerCount
    });
    
    // 判断是否庄家和牌（如果有庄家和牌则连庄）
    const dealerWon = multiWinners[currentDealerIndex];
    
    // 获取下一轮信息
    const nextRound = mahjong.getNextRound(gameState, dealerWon, currentDealerIndex);
    
    // 更新庄家标记
    newPlayers.forEach((p, i) => {
      p.isDealer = (i === nextRound.newDealerIndex);
    });
    
    // 检查游戏是否结束
    const gameEnd = mahjong.checkGameEnd(
      this.data.gameSettings,
      { wind: nextRound.wind, round: nextRound.round, honba: nextRound.honba },
      newPlayers,
      nextRound.newDealerIndex
    );
    
    this.setData({
      players: newPlayers,
      gameState: {
        wind: nextRound.wind,
        round: nextRound.round,
        honba: nextRound.honba,
        riichiSticks: 0
      },
      currentDealerIndex: nextRound.newDealerIndex,
      roundHistory,
      windText: this.getWindText(nextRound.wind),
      showWinDialog: false,
      isGameOver: gameEnd.ended
    });
    
    this.saveGameState();
    
    if (gameEnd.ended) {
      this.showGameOverDialog();
    } else {
      wx.showToast({
        title: `三家和已记录 (${winnerCount}家)`,
        icon: 'success'
      });
    }
  },

  // 显示游戏结束对话框
  showGameOverDialog() {
    const ranking = [...this.data.players].sort((a, b) => b.score - a.score);
    this.setData({
      finalRanking: ranking,
      isGameOver: true
    });
  },

  // 返回首页
  backToHome() {
    wx.navigateBack();
  },

  // 显示历史记录
  showHistory() {
    wx.showModal({
      title: '历史记录',
      content: '历史记录功能开发中...',
      showCancel: false
    });
  },

  // 显示设置
  showSettings() {
    wx.showModal({
      title: '设置',
      content: '设置功能开发中...',
      showCancel: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止对话框内容点击时关闭对话框
  }
});
