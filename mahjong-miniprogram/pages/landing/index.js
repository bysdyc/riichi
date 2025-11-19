const storage = require('../../utils/storage');

Page({
  data: {
    hasSavedGame: false,
    tobu: true,
    useKlassicYaku: false
  },

  onShow() {
    const saved = storage.loadGame();
    this.setData({ hasSavedGame: !!saved });
  },

  onToggleTobu(evt) {
    this.setData({ tobu: evt.detail.value });
  },

  onToggleKlassicYaku(evt) {
    this.setData({ useKlassicYaku: evt.detail.value });
  },

  onStartTonpuu() {
    this.startGame('tonpuu');
  },

  onStartHanchan() {
    this.startGame('hanchan');
  },

  onStartYonchan() {
    this.startGame('yonchan');
  },

  startGame(type) {
    const app = getApp();
    app.globalData.gameSettings = { 
      type, 
      tobu: this.data.tobu,
      useKlassicYaku: this.data.useKlassicYaku
    };
    app.globalData.isGameOver = false;
    app.globalData.players = [
      { id: 1, name: '甲', score: 25000, wind: '東', isRiichi: false },
      { id: 2, name: '乙', score: 25000, wind: '南', isRiichi: false },
      { id: 3, name: '丙', score: 25000, wind: '西', isRiichi: false },
      { id: 4, name: '丁', score: 25000, wind: '北', isRiichi: false }
    ];
    app.globalData.gameState = { wind: 'east', round: 1, honba: 0, riichiSticks: 0 };
    app.globalData.currentDealerIndex = 0;
    app.globalData.roundHistory = [];
    storage.saveGame({
      gameSettings: app.globalData.gameSettings,
      isGameOver: false,
      players: app.globalData.players,
      gameState: app.globalData.gameState,
      currentDealerIndex: 0,
      roundHistory: []
    });
    wx.redirectTo({ url: '/pages/game/index' });
  },

  onContinue() {
    const saved = storage.loadGame();
    if (!saved) {
      wx.showToast({ title: '没有存档', icon: 'none' });
      return;
    }
    const app = getApp();
    Object.assign(app.globalData, saved);
    wx.redirectTo({ url: '/pages/game/index' });
  },

  onClear() {
    storage.clearGame();
    this.setData({ hasSavedGame: false });
    wx.showToast({ title: '已清除存档', icon: 'success' });
  }
});