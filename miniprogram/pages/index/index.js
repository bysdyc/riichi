// pages/index/index.js
Page({
  data: {
    tobu: false,
    hasSavedGame: false
  },

  onLoad() {
    this.checkSavedGame()
  },

  onShow() {
    this.checkSavedGame()
  },

  checkSavedGame() {
    try {
      const saved = wx.getStorageSync('riichi_game_state')
      this.setData({
        hasSavedGame: !!saved
      })
    } catch (e) {
      console.error('检查存档失败', e)
    }
  },

  tobuChange(e) {
    this.setData({
      tobu: e.detail.value.includes('tobu')
    })
  },

  selectGameType(e) {
    const type = e.currentTarget.dataset.type
    const gameSettings = {
      type: type,
      tobu: this.data.tobu
    }

    // 保存游戏设置
    wx.setStorageSync('riichi_game_settings', gameSettings)

    // 初始化新游戏
    const initialState = {
      gameSettings: gameSettings,
      players: [
        { id: 1, name: '甲', score: 25000, wind: '東', isRiichi: false },
        { id: 2, name: '乙', score: 25000, wind: '南', isRiichi: false },
        { id: 3, name: '丙', score: 25000, wind: '西', isRiichi: false },
        { id: 4, name: '丁', score: 25000, wind: '北', isRiichi: false }
      ],
      gameState: {
        wind: 'east',
        round: 1,
        honba: 0,
        riichiSticks: 0
      },
      currentDealerIndex: 0,
      roundHistory: [],
      isGameOver: false
    }

    wx.setStorageSync('riichi_game_state', initialState)

    // 跳转到游戏页面
    wx.navigateTo({
      url: '/pages/game/game'
    })
  },

  continueGame() {
    wx.navigateTo({
      url: '/pages/game/game'
    })
  },

  clearSavedGame() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前存档吗？此操作不可恢复。',
      confirmText: '确定清除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('riichi_game_state')
          wx.removeStorageSync('riichi_game_settings')
          this.setData({
            hasSavedGame: false
          })
          wx.showToast({
            title: '存档已清除',
            icon: 'success'
          })
        }
      }
    })
  }
})
