const { tileTypes } = require('../../utils/constants');

function buildSections() {
  return [
    { title: '万子', tiles: tileTypes.man, columns: 9, type: 'man' },
    { title: '筒子', tiles: tileTypes.pin, columns: 9, type: 'pin' },
    { title: '索子', tiles: tileTypes.sou, columns: 9, type: 'sou' },
    { title: '字牌', tiles: tileTypes.honor, columns: 7, type: 'honor' }
  ];
}

Component({
  properties: {
    tileUsage: {
      type: Object,
      value: {}
    }
  },

  data: {
    sections: buildSections(),
    isCollapsed: false
  },

  methods: {
    onTileTap(evt) {
      const { tile } = evt.currentTarget.dataset;
      if (!tile) return;
      const usage = this.properties.tileUsage || {};
      if (usage[tile] >= 4) {
        return;
      }
      // 添加轻微震动反馈
      wx.vibrateShort({ type: 'light' });
      this.triggerEvent('select', { tile });
    },

    onToggleCollapse() {
      this.setData({
        isCollapsed: !this.data.isCollapsed
      });
      // 折叠/展开时也添加震动反馈
      wx.vibrateShort({ type: 'light' });
    }
  }
});