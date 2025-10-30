// pages/history/history.js
Page({
  data: {
    roundHistory: []
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    try {
      const savedState = wx.getStorageSync('riichi_game_state');
      if (savedState && savedState.roundHistory) {
        const windMap = {
          'east': '東',
          'south': '南',
          'west': '西',
          'north': '北'
        };

        const roundHistory = savedState.roundHistory.map(item => ({
          ...item,
          windText: windMap[item.wind] || '東',
          typeText: item.type === 'win' ? '和牌' : '流局'
        }));

        this.setData({
          roundHistory
        });
      }
    } catch (e) {
      console.error('加载历史失败', e);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  }
});
