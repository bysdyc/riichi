// components/tile-selector/tile-selector.js
Component({
  properties: {
    title: {
      type: String,
      value: '选择牌'
    },
    maxTiles: {
      type: Number,
      value: 14
    },
    initialTiles: {
      type: Array,
      value: []
    }
  },

  data: {
    manTiles: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'],
    pinTiles: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'],
    souTiles: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
    honorTiles: ['1z', '2z', '3z', '4z', '5z', '6z', '7z'],
    selectedTiles: [],
    selectedCount: 0,
    
    // 显示名称映射
    tileDisplayMap: {
      '1m': '一万', '2m': '二万', '3m': '三万', '4m': '四万', '5m': '五万',
      '6m': '六万', '7m': '七万', '8m': '八万', '9m': '九万',
      '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
      '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
      '1s': '一索', '2s': '二索', '3s': '三索', '4s': '四索', '5s': '五索',
      '6s': '六索', '7s': '七索', '8s': '八索', '9s': '九索',
      '1z': '东', '2z': '南', '3z': '西', '4z': '北',
      '5z': '白', '6z': '发', '7z': '中'
    }
  },

  lifetimes: {
    attached() {
      if (this.properties.initialTiles && this.properties.initialTiles.length > 0) {
        this.setData({
          selectedTiles: [...this.properties.initialTiles],
          selectedCount: this.properties.initialTiles.length
        });
      }
    }
  },

  methods: {
    // 选择牌
    selectTile(e) {
      const tile = e.currentTarget.dataset.tile;
      const selectedTiles = [...this.data.selectedTiles];
      const tileCount = selectedTiles.filter(t => t === tile).length;
      
      // 检查是否已经选择了4张同样的牌
      if (tileCount >= 4) {
        wx.showToast({
          title: '同一种牌最多4张',
          icon: 'none'
        });
        return;
      }
      
      // 检查是否达到最大数量
      if (selectedTiles.length >= this.properties.maxTiles) {
        wx.showToast({
          title: `最多选择${this.properties.maxTiles}张牌`,
          icon: 'none'
        });
        return;
      }
      
      selectedTiles.push(tile);
      this.setData({
        selectedTiles,
        selectedCount: selectedTiles.length
      });
      
      this.triggerEvent('change', { tiles: selectedTiles });
    },

    // 获取牌的显示名称
    getTileDisplay(tile) {
      // 简化显示：只显示数字或字
      const map = {
        '1m': '1', '2m': '2', '3m': '3', '4m': '4', '5m': '5',
        '6m': '6', '7m': '7', '8m': '8', '9m': '9',
        '1p': '1', '2p': '2', '3p': '3', '4p': '4', '5p': '5',
        '6p': '6', '7p': '7', '8p': '8', '9p': '9',
        '1s': '1', '2s': '2', '3s': '3', '4s': '4', '5s': '5',
        '6s': '6', '7s': '7', '8s': '8', '9s': '9',
        '1z': '东', '2z': '南', '3z': '西', '4z': '北',
        '5z': '白', '6z': '发', '7z': '中'
      };
      return map[tile] || tile;
    },

    // 获取某张牌已选择的数量
    getTileCount(tile) {
      return this.data.selectedTiles.filter(t => t === tile).length;
    },

    // 判断牌是否被选中
    isTileSelected(tile) {
      return this.data.selectedTiles.includes(tile);
    },

    // 清空选择
    clearAll() {
      this.setData({
        selectedTiles: [],
        selectedCount: 0
      });
      this.triggerEvent('change', { tiles: [] });
    },

    // 确认选择
    confirmSelection() {
      if (this.data.selectedTiles.length === 0) {
        wx.showToast({
          title: '请先选择牌',
          icon: 'none'
        });
        return;
      }
      
      this.triggerEvent('confirm', { tiles: this.data.selectedTiles });
    }
  }
});
