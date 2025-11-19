Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    players: {
      type: Array,
      value: []
    },
    gameState: {
      type: Object,
      value: null
    },
    gameSettings: {
      type: Object,
      value: null
    },
    roundHistory: {
      type: Array,
      value: []
    }
  },

  data: {
    rankedPlayers: [],
    playerStats: [],
    gameTypeLabel: '',
    finalRoundDisplay: ''
  },

  observers: {
    'visible, players, gameState, gameSettings, roundHistory': function(visible, players, gameState, gameSettings, roundHistory) {
      if (visible && players && players.length > 0) {
        this.calculateResults();
      }
    }
  },

  methods: {
    calculateResults() {
      const { players, gameState, gameSettings, roundHistory } = this.properties;
      const initialScore = 25000;

      // 计算排名
      const rankedPlayers = [...players]
        .map((p, index) => ({
          ...p,
          originalIndex: index,
          scoreDiff: p.score - initialScore
        }))
        .sort((a, b) => b.score - a.score);

      // 计算玩家统计
      const playerStats = players.map((player, playerIndex) => {
        let winCount = 0;
        let loseCount = 0;
        let riichiCount = 0;

        roundHistory.forEach(record => {
          const type = record.type;
          const playerName = player.name;

          // 自摸或荣和
          if (type === '自摸' || type === '荣和') {
            // 检查是否是和牌者
            if (record.winner === playerName) {
              winCount++;
            }
            // 检查是否是放铳者（只有荣和才有放铳者）
            if (record.loser === playerName) {
              loseCount++;
            }
            // 检查是否立直
            if (record.riichiPlayers && record.riichiPlayers.includes(playerName)) {
              riichiCount++;
            }
          } 
          // 多人和牌
          else if (type === '多人和牌') {
            // 检查是否是和牌者之一（winner字段包含多个玩家名，用顿号分隔）
            if (record.winner && record.winner.split('、').includes(playerName)) {
              winCount++;
            }
            // 检查是否是放铳者
            if (record.loser === playerName) {
              loseCount++;
            }
            // 检查是否立直
            if (record.riichiPlayers && record.riichiPlayers.includes(playerName)) {
              riichiCount++;
            }
          } 
          // 流局
          else if (type === '流局') {
            // 只统计立直
            if (record.riichiPlayers && record.riichiPlayers.includes(playerName)) {
              riichiCount++;
            }
          }
        });

        return {
          name: player.name,
          score: player.score,
          winCount,
          loseCount,
          riichiCount
        };
      });

      // 对局类型标签
      const gameTypeMap = {
        'tonpuu': '东风战',
        'hanchan': '半庄战',
        'yonchan': '一庄战'
      };
      const baseType = gameTypeMap[gameSettings?.type] || '未知';
      const rules = [];
      if (gameSettings?.tobu) rules.push('击飞');
      if (gameSettings?.useKlassicYaku) rules.push('古役');
      const gameTypeLabel = rules.length ? `${baseType} (${rules.join('、')})` : baseType;

      // 最终场次 - 从最后一条历史记录获取,因为 gameState 已经进入下一局
      let finalRoundDisplay = '东 1 局';
      if (roundHistory && roundHistory.length > 0) {
        const lastRecord = roundHistory[roundHistory.length - 1];
        finalRoundDisplay = lastRecord.roundLabel || '东 1 局';
      }

      this.setData({
        rankedPlayers,
        playerStats,
        gameTypeLabel,
        finalRoundDisplay
      });
    },

    onBackground(e) {
      // 点击背景不关闭，只能通过按钮关闭
    },

    onViewHistory() {
      this.triggerEvent('viewhistory');
    },

    onClose() {
      this.triggerEvent('close');
    },

    onSaveImage() {
      wx.showLoading({ title: '生成图片中...', mask: true });
      
      const query = this.createSelectorQuery();
      query.select('#gameOverCanvas')
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
          
          // 计算实际内容高度
          const contentHeight = this.calculateContentHeight();
          const canvasWidth = 680; // 对话框宽度 680rpx
          const canvasHeight = contentHeight;
          
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);

          // 绘制完整内容
          this.drawStyledContent(ctx, canvasWidth, canvasHeight);

          // 转换为图片
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (canvasRes) => {
              wx.hideLoading();
              this.saveImageToAlbum(canvasRes.tempFilePath);
            },
            fail: (err) => {
              console.error('生成图片失败：', err);
              wx.hideLoading();
              wx.showToast({ title: '生成图片失败', icon: 'none' });
            }
          }, this);
        });
    },

    calculateContentHeight() {
      const { rankedPlayers, playerStats } = this.data;
      let height = 0;
      height += 80; // 头部
      height += 48; // section padding
      height += rankedPlayers.length * (88 + 16); // 排名项 + 间距
      height += 48 + 160; // 对局统计
      height += 48; // section padding
      height += playerStats.length * (150 + 16); // 详细数据
      height += 100; // 底部按钮
      return height;
    },

    drawStyledContent(ctx, width, height) {
      const { rankedPlayers, playerStats, gameTypeLabel, finalRoundDisplay, roundHistory, gameState } = this.data;
      
      // 绘制白色渐变背景
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#ffffff');
      bgGradient.addColorStop(1, '#f8fafc');
      ctx.fillStyle = bgGradient;
      this.roundRect(ctx, 0, 0, width, height, 24);
      ctx.fill();

      let y = 0;

      // 绘制头部（蓝色渐变）
      const headerGradient = ctx.createLinearGradient(0, 0, width, 80);
      headerGradient.addColorStop(0, '#3b82f6');
      headerGradient.addColorStop(1, '#2563eb');
      ctx.fillStyle = headerGradient;
      this.roundRect(ctx, 0, 0, width, 80, 24);
      ctx.fill();
      
      // 绘制标题
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎊 对局结束', width / 2, 55);
      ctx.textAlign = 'left';
      
      y = 80 + 32;

      // 最终排名 section
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 30px sans-serif';
      ctx.fillText('最终排名', 44, y);
      y += 36;

      // 排名列表
      rankedPlayers.forEach((player, index) => {
        const itemY = y;
        const itemHeight = 88;
        const itemPadding = 32;
        
        // 绘制排名卡片背景和边框
        const rankColors = [
          { border: '#fbbf24', bg1: '#fef3c7', bg2: '#ffffff' }, // 金色
          { border: '#94a3b8', bg1: '#f1f5f9', bg2: '#ffffff' }, // 银色
          { border: '#f97316', bg1: '#fed7aa', bg2: '#ffffff' }, // 铜色
          { border: 'transparent', bg1: '#ffffff', bg2: '#ffffff' }  // 普通
        ];
        const color = rankColors[index] || rankColors[3];
        
        // 绘制边框
        if (color.border !== 'transparent') {
          ctx.strokeStyle = color.border;
          ctx.lineWidth = 3;
          this.roundRect(ctx, itemPadding, itemY, width - itemPadding * 2, itemHeight, 16);
          ctx.stroke();
        }
        
        // 绘制背景渐变
        const itemGradient = ctx.createLinearGradient(0, itemY, width, itemY + itemHeight);
        itemGradient.addColorStop(0, color.bg1);
        itemGradient.addColorStop(1, color.bg2);
        ctx.fillStyle = itemGradient;
        this.roundRect(ctx, itemPadding, itemY, width - itemPadding * 2, itemHeight, 16);
        ctx.fill();
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, itemPadding, itemY, width - itemPadding * 2, itemHeight, 16);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // 排名徽章
        const medals = ['🥇', '🥈', '🥉'];
        const rankText = index < 3 ? medals[index] : String(index + 1);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(rankText, itemPadding + 24, itemY + itemHeight / 2 + 10);
        
        // 玩家名
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(player.name, itemPadding + 80, itemY + itemHeight / 2 + 10);
        
        // 分数
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(player.score), width - itemPadding - 120, itemY + itemHeight / 2 + 10);
        
        // 分差
        const diffColor = player.scoreDiff >= 0 ? '#10b981' : '#ef4444';
        ctx.fillStyle = diffColor;
        ctx.font = '600 24px sans-serif';
        const diffText = `${player.scoreDiff >= 0 ? '+' : ''}${player.scoreDiff}`;
        ctx.fillText(diffText, width - itemPadding - 24, itemY + itemHeight / 2 + 10);
        ctx.textAlign = 'left';
        
        y += itemHeight + 16;
      });

      y += 32;

      // 对局统计 section
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 30px sans-serif';
      ctx.fillText('对局统计', 44, y);
      y += 36;

      const stats = [
        ['对局类型', gameTypeLabel],
        ['总局数', `${roundHistory.length} 局`],
        ['最终场次', finalRoundDisplay],
        ['本场数', `${gameState.honba || 0} 本场`]
      ];
      
      stats.forEach(([label, value]) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '22px sans-serif';
        ctx.fillText(label, 56, y);
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 26px sans-serif';
        ctx.fillText(value, 200, y);
        y += 40;
      });

      y += 32;

      // 详细数据 section
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 30px sans-serif';
      ctx.fillText('详细数据', 44, y);
      y += 36;

      // 详细数据卡片
      playerStats.forEach((player) => {
        const cardY = y;
        const cardHeight = 134;
        const cardPadding = 32;
        
        // 绘制卡片背景
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        this.roundRect(ctx, cardPadding, cardY, width - cardPadding * 2, cardHeight, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // 玩家名
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(player.name, cardPadding + 24, cardY + 40);
        
        // 分数
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${player.score} 点`, width - cardPadding - 24, cardY + 40);
        ctx.textAlign = 'left';
        
        // 统计数据
        const detailStats = [
          ['和牌次数', player.winCount],
          ['放铳次数', player.loseCount],
          ['立直次数', player.riichiCount]
        ];
        
        const statWidth = (width - cardPadding * 2 - 48) / 3;
        detailStats.forEach(([label, value], idx) => {
          const statX = cardPadding + 24 + idx * statWidth;
          
          ctx.fillStyle = '#64748b';
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, statX + statWidth / 2, cardY + 80);
          
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText(String(value), statX + statWidth / 2, cardY + 115);
        });
        ctx.textAlign = 'left';
        
        y += cardHeight + 16;
      });
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

    saveImageToAlbum(tempFilePath) {
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
            console.error('保存图片失败：', err);
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      });
    },

    noop() {}
  }
});
