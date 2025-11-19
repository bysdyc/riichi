Page({
  data: {
    history: []
  },

  onShow() {
    const app = getApp();
    const history = (app.globalData.roundHistory || []).slice().reverse();
    this.setData({ history });
  },
});