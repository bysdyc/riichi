const formatter = require('../../utils/formatter');

// 生成友好的文件名
function generateFileName(gameData, extension) {
  const { gameSettings, players, roundHistory } = gameData;
  
  // 获取对局时间
  const gameTime = roundHistory.gameStartTime ? new Date(roundHistory.gameStartTime) : new Date();
  const dateStr = gameTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/[/:]/g, '-').replace(/\s/g, '_');
  
  // 获取对局类型
  const gameType = gameSettings.type === 'tonpuu' ? '东风' : '半庄';
  
  // 获取玩家名称（最多前2位）
  const playerNames = players.slice(0, 2).map(p => p.name).join('_');
  
  return `麻将${gameType}_${playerNames}_${dateStr}${extension}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

Page({
  data: {
    exportText: '',
    exportFormat: 'text',
    textLength: 0,
    gameData: null,
    shareImagePath: ''
  },

  onShow() {
    const app = getApp();
    const gameData = {
      gameSettings: app.globalData.gameSettings,
      players: app.globalData.players,
      gameState: app.globalData.gameState,
      roundHistory: app.globalData.roundHistory,
      isGameOver: app.globalData.isGameOver
    };
    this.setData({ gameData });
    this.updateExportText();
  },

  updateExportText() {
    const { gameData, exportFormat } = this.data;
    
    if (!gameData) {
      this.setData({ exportText: '', textLength: 0 });
      return;
    }

    let exportText = '';
    
    if (exportFormat === 'text') {
      exportText = formatter.buildExportText(gameData);
    } else if (exportFormat === 'markdown') {
      exportText = formatter.buildMarkdownText(gameData);
    } else if (exportFormat === 'json') {
      exportText = formatter.buildJSONText(gameData);
    }

    this.setData({ 
      exportText,
      textLength: exportText.length
    });
  },

  onFormatChange(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({ exportFormat: format }, () => {
      this.updateExportText();
    });
  },

  onCopy() {
    if (!this.data.exportText) {
      wx.showToast({ title: '暂无内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.exportText,
      success: () => {
        wx.showToast({ 
          title: '复制成功', 
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({ 
          title: '复制失败', 
          icon: 'none' 
        });
      }
    });
  },

  onShare() {
    if (!this.data.exportText) {
      wx.showToast({ title: '暂无内容', icon: 'none' });
      return;
    }
    
    wx.showActionSheet({
      itemList: ['复制后分享', '生成图片分享'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.onCopy();
        } else if (res.tapIndex === 1) {
          this.generateImage();
        }
      }
    });
  },

  generateImage() {
    wx.showLoading({ title: '生成图片中...', mask: true });
    
    const { gameData } = this.data;
    if (!gameData) {
      wx.hideLoading();
      wx.showToast({ title: '数据错误', icon: 'none' });
      return;
    }

    // 使用 canvas 2d API
    const query = wx.createSelectorQuery();
    query.select('#exportCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          wx.hideLoading();
          wx.showToast({ title: '画布初始化失败', icon: 'none' });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = 750;
        const height = this.calculateImageHeight(gameData);
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // 绘制背景
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);

        // 绘制卡片背景
        const padding = 20;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        this.roundRect(ctx, padding, padding, width - padding * 2, height - padding * 2, 10);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // 绘制内容
        let y = padding + 30;
        y = this.drawImageContent(ctx, gameData, padding + 20, y, width - padding * 2 - 40);

        // 转换为图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            wx.hideLoading();
            this.saveAndShareImage(res.tempFilePath);
          },
          fail: (err) => {
            console.error('生成图片失败：', err);
            wx.hideLoading();
            wx.showToast({ title: '生成图片失败', icon: 'none' });
          }
        });
      });
  },

  calculateImageHeight(gameData) {
    const { players, roundHistory, gameSettings } = gameData;
    let height = 200; // 标题区域
    height += players.length * 80; // 最终排名
    height += Math.min(roundHistory.records?.length || 0, 10) * 100; // 对局记录(最多显示10条)
    height += 100; // 底部信息
    return Math.min(height, 3000); // 限制最大高度
  },

  drawImageContent(ctx, gameData, x, y, maxWidth) {
    const { gameSettings, players, roundHistory, isGameOver } = gameData;
    
    // 标题
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🀄️ 麻将对局记录', x, y);
    y += 50;

    // 对局信息
    ctx.fillStyle = '#666666';
    ctx.font = '24px sans-serif';
    const gameType = gameSettings.type === 'tonpuu' ? '东风战' : '半庄战';
    const rules = [];
    if (gameSettings.tobu) rules.push('击飞');
    if (gameSettings.useKlassicYaku) rules.push('古役');
    const rulesText = rules.length > 0 ? ` (${rules.join('、')})` : '';
    ctx.fillText(`对局类型: ${gameType}${rulesText}`, x, y);
    y += 40;

    const timestamp = roundHistory.gameStartTime ? 
      new Date(roundHistory.gameStartTime).toLocaleString('zh-CN') : '未知时间';
    ctx.fillText(`对局时间: ${timestamp}`, x, y);
    y += 60;

    // 最终排名
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('最终排名', x, y);
    y += 45;

    players.forEach((player, index) => {
      const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣'][index] || `${index + 1}️⃣`;
      ctx.fillStyle = '#333333';
      ctx.font = '24px sans-serif';
      ctx.fillText(`${rankEmoji} ${player.name}`, x + 10, y);
      
      const scoreColor = player.score >= 0 ? '#2ecc71' : '#e74c3c';
      ctx.fillStyle = scoreColor;
      ctx.font = 'bold 24px sans-serif';
      const scoreText = `${player.score >= 0 ? '+' : ''}${player.score}`;
      ctx.fillText(scoreText, x + 400, y);
      y += 50;
    });

    y += 20;

    // 对局详情
    if (roundHistory.records && roundHistory.records.length > 0) {
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('对局详情', x, y);
      y += 45;

      const displayRecords = roundHistory.records.slice(0, 10);
      displayRecords.forEach((record, idx) => {
        ctx.fillStyle = '#666666';
        ctx.font = '20px sans-serif';
        ctx.fillText(`${record.roundLabel || `第${idx + 1}局`}`, x + 10, y);
        y += 35;
        
        ctx.fillStyle = '#333333';
        ctx.font = '22px sans-serif';
        if (record.winner) {
          ctx.fillText(`✓ ${record.winner.name} 和牌`, x + 20, y);
        } else if (record.isDraw) {
          ctx.fillText('流局', x + 20, y);
        }
        y += 45;
      });

      if (roundHistory.records.length > 10) {
        ctx.fillStyle = '#999999';
        ctx.font = '20px sans-serif';
        ctx.fillText(`...还有 ${roundHistory.records.length - 10} 局未显示`, x + 10, y);
        y += 40;
      }
    }

    y += 20;

    // 底部信息
    ctx.fillStyle = '#999999';
    ctx.font = '18px sans-serif';
    ctx.fillText('由麻将记分小程序生成', x, y);

    return y;
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  saveAndShareImage(tempFilePath) {
    wx.showActionSheet({
      itemList: ['保存到相册', '发送给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
              wx.showToast({ 
                title: '已保存到相册', 
                icon: 'success',
                duration: 2000
              });
            },
            fail: (err) => {
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '需要授权',
                  content: '需要您授权保存图片到相册',
                  confirmText: '去授权',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            }
          });
        } else if (res.tapIndex === 1) {
          // 分享给朋友
          this.setData({ shareImagePath: tempFilePath });
          wx.showToast({ 
            title: '请点击右上角分享', 
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  onSaveToFile() {
    if (!this.data.exportText) {
      wx.showToast({ title: '暂无内容', icon: 'none' });
      return;
    }

    // 直接调用保存文本文件功能
    this.saveAsTextFile();
  },

  saveAsTextFile() {
    const { exportFormat, exportText, gameData } = this.data;
    const extension = exportFormat === 'json' ? '.json' : exportFormat === 'markdown' ? '.md' : '.txt';
    const fileName = generateFileName(gameData, extension);
    
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    wx.showLoading({ title: '保存中...', mask: true });
    
    fs.writeFile({
      filePath: filePath,
      data: exportText,
      encoding: 'utf8',
      success: () => {
        wx.hideLoading();
        
        // 获取文件信息
        fs.stat({
          path: filePath,
          success: (statRes) => {
            const fileSize = formatFileSize(statRes.size);
            
            // 尝试打开文档选择器分享文件
            wx.showModal({
              title: '✅ 保存成功',
              content: `文件名：${fileName}\n文件大小：${fileSize}\n\n是否立即分享文件？`,
              confirmText: '分享',
              cancelText: '暂不',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.shareFile(filePath, fileName);
                }
              }
            });
          },
          fail: () => {
            // 如果获取文件信息失败，仍然显示保存成功
            wx.showModal({
              title: '✅ 保存成功',
              content: `文件已生成：${fileName}\n\n是否立即分享文件？`,
              confirmText: '分享',
              cancelText: '暂不',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.shareFile(filePath, fileName);
                }
              }
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('保存文件失败：', err);
        wx.showToast({ 
          title: '保存失败', 
          icon: 'none' 
        });
      }
    });
  },

  shareFile(filePath, fileName) {
    // 微信小程序可以通过 wx.shareFileMessage 分享文件（需要在聊天环境中）
    if (wx.shareFileMessage) {
      wx.shareFileMessage({
        filePath: filePath,
        fileName: fileName,
        success: () => {
          wx.showToast({ 
            title: '分享成功', 
            icon: 'success' 
          });
        },
        fail: (err) => {
          console.error('分享文件失败：', err);
          // 如果分享失败，提供其他选项
          wx.showModal({
            title: '分享失败',
            content: '当前环境不支持文件分享，建议使用"复制到剪贴板"功能或"发送到文件传输助手"。',
            showCancel: false
          });
        }
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '当前环境不支持直接分享文件，建议使用"复制到剪贴板"功能或"发送到文件传输助手"。',
        showCancel: false
      });
    }
  },

  onShareAppMessage() {
    const { shareImagePath, gameData } = this.data;
    
    if (shareImagePath) {
      // 如果有生成的图片，分享图片
      return {
        title: '麻将对局记录分享',
        path: '/pages/landing/index',
        imageUrl: shareImagePath
      };
    }
    
    // 默认分享
    return {
      title: '麻将对局记录分享',
      path: '/pages/landing/index'
    };
  },

  onShareTimeline() {
    const { shareImagePath } = this.data;
    
    return {
      title: '麻将对局记录',
      query: '',
      imageUrl: shareImagePath || ''
    };
  }
});