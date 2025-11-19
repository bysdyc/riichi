const STORAGE_KEY = 'mahjong_game_state';

function saveGame(state) {
  try {
    wx.setStorageSync(STORAGE_KEY, state);
  } catch (err) {
    console.error('保存小程序存档失败', err);
  }
}

function loadGame() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null;
  } catch (err) {
    console.error('读取小程序存档失败', err);
    return null;
  }
}

function clearGame() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (err) {
    console.error('清除小程序存档失败', err);
  }
}

module.exports = {
  saveGame,
  loadGame,
  clearGame
};