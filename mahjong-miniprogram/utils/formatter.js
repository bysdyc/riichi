const typeMap = {
  tonpuu: '东风战',
  hanchan: '半庄战',
  yonchan: '全庄战'
};

const windDisplay = {
  east: '东',
  south: '南',
  west: '西',
  north: '北'
};

function formatScore(value) {
  if (typeof value !== 'number') return '0';
  if (typeof value.toLocaleString === 'function') {
    return value.toLocaleString('zh-CN');
  }
  return `${value}`;
}

function buildExportText(state) {
  if (!state) {
    return '暂无对局数据。';
  }

  const {
    gameSettings = {},
    players = [],
    gameState = {},
    roundHistory = [],
    isGameOver = false
  } = state;

  const exportDate = new Date().toLocaleString('zh-CN');
  const lines = [];

  lines.push('==========================================');
  lines.push('      日本麻将对局记录');
  lines.push('==========================================');
  lines.push('');

  lines.push(`导出时间: ${exportDate}`);
  const typeLabel = typeMap[gameSettings.type] || '自定义对局';
  const rules = [];
  if (gameSettings.tobu) rules.push('击飞规则');
  if (gameSettings.useKlassicYaku) rules.push('古役');
  const rulesText = rules.length ? ` (${rules.join('、')})` : '';
  lines.push(`对局类型: ${typeLabel}${rulesText}`);
  const windLabel = windDisplay[gameState.wind] || '东';
  lines.push(`当前进度: ${windLabel}场 第 ${gameState.round || 1} 局 / ${gameState.honba || 0} 本场`);
  lines.push(`立直棒: ${gameState.riichiSticks || 0}`);
  lines.push(`对局状态: ${isGameOver ? '已结束' : '进行中'}`);
  lines.push(`总记录数: ${roundHistory.length}`);
  lines.push('');

  lines.push('------------------------------------------');
  lines.push('玩家信息');
  lines.push('------------------------------------------');

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sortedPlayers.forEach((player, index) => {
    const rank = index + 1;
    const rankSymbol = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    const name = player.name || `玩家${rank}`;
    lines.push(
      `${rankSymbol} ${rank}. ${name} (${player.wind || ''})：${formatScore(player.score || 0)} 点${player.isRiichi ? ' [立直中]' : ''}`
    );
  });

  lines.push('');
  lines.push('------------------------------------------');
  lines.push('对局历史');
  lines.push('------------------------------------------');
  lines.push('');

  if (!roundHistory.length) {
    lines.push('暂无历史记录。');
  } else {
    roundHistory.forEach((round, idx) => {
      lines.push(`【第 ${idx + 1} 局】`);
      lines.push(`  局数: ${round.roundLabel || round.round || '未知'}`);
      lines.push(`  类型: ${round.type || '—'}`);

      if (round.type === '流局') {
        const tenpaiNames = (round.tenpaiPlayers && round.tenpaiPlayers.length)
          ? round.tenpaiPlayers.join('、')
          : '无';
        lines.push(`  听牌玩家: ${tenpaiNames}`);

        if (round.scoreSummary) {
          const summary = round.scoreSummary;
          const tenpaiCount = summary.tenpaiCount || 0;
          const notenCount = summary.notenCount || 0;
          lines.push(`  听牌人数: ${tenpaiCount} / 未听人数: ${notenCount}`);
          if ((summary.gainPerTenpai || 0) > 0 || (summary.lossPerNoten || 0) > 0) {
            lines.push(
              `  分配: 听牌每人 +${formatScore(summary.gainPerTenpai || 0)} 点 / 未听每人 -${formatScore(summary.lossPerNoten || 0)} 点`
            );
          }
        }
      } else if (round.type === '多人和牌') {
        lines.push(`  和牌者: ${round.winner || '—'}`);
        if (round.loser) {
          lines.push(`  放铳者: ${round.loser}`);
        }
        const details = round.multiWinDetails || [];
        if (details.length) {
          lines.push('  --- 和牌详情 ---');
          details.forEach(detail => {
            const labelParts = [`    ${detail.name || '—'}: ${detail.han || 0}番`];
            if (detail.fu && detail.fu !== '—') {
              labelParts.push(`${detail.fu}符`);
            }
            labelParts.push(`基础 ${formatScore(detail.points || 0)} 点`);
            if (detail.bonus) {
              labelParts.push(`立直棒 +${formatScore(detail.bonus)}`);
            }
            lines.push(labelParts.join(' '));
          });
        }
        if (round.scoreSummary) {
          const summary = round.scoreSummary;
          if (summary.totalGain) {
            lines.push(`  合计收益: ${formatScore(summary.totalGain)} 点`);
          }
          if (summary.loserLoss) {
            lines.push(`  放铳损失: ${formatScore(Math.abs(summary.loserLoss))} 点`);
          }
          if (summary.bonusPerWinner) {
            lines.push(`  立直棒分配: 每位和牌者 +${formatScore(summary.bonusPerWinner)} 点`);
          }
        }
      } else {
        lines.push(`  和牌者: ${round.winner || '—'}`);
        if (round.loser && round.loser !== '—') {
          lines.push(`  放铳者: ${round.loser}`);
        }
        lines.push(`  番符: ${round.han || 0}番 ${round.fu || 0}符`);

        // 添加手牌信息
        if (round.handSnapshot) {
          const hs = round.handSnapshot;
          if (hs.handTiles && hs.handTiles.length) {
            lines.push(`  手牌: ${hs.handTiles.join(' ')}`);
          }
          if (hs.winTile) {
            lines.push(`  和牌: ${hs.winTile}`);
          }
          if (hs.melds && hs.melds.length) {
            const meldDescs = hs.melds.map(m => {
              const typeMap = { shuntsu: '顺子', pon: '刻子', minkan: '明杠', ankan: '暗杠' };
              return `${typeMap[m.type] || m.type}(${m.tiles.join('')})`;
            });
            lines.push(`  副露: ${meldDescs.join('、')}`);
          }
          
          // 添加宝牌信息
          if (hs.dora) {
            const doraItems = [];
            if (hs.dora.dora > 0) doraItems.push(`宝牌×${hs.dora.dora}`);
            if (hs.dora.uraDora > 0) doraItems.push(`里宝牌×${hs.dora.uraDora}`);
            if (hs.dora.redDora > 0) doraItems.push(`赤宝牌×${hs.dora.redDora}`);
            if (doraItems.length) {
              lines.push(`  宝牌: ${doraItems.join('、')}`);
            }
          }
        }

        if (round.scoreSummary) {
          const summary = round.scoreSummary;
          if (summary.yaku && summary.yaku.length) {
            lines.push(`  役种: ${summary.yaku.join('、')}`);
          }
          if (summary.each) {
            lines.push(`  得点: 自摸 每家 ${formatScore(summary.each)} 点`);
          } else if (summary.dealer || summary.nonDealer) {
            lines.push(`  得点: 庄家 ${formatScore(summary.dealer || 0)} / 闲家 ${formatScore(summary.nonDealer || 0)}`);
          } else if (summary.total) {
            lines.push(`  得点: ${formatScore(summary.total)} 点`);
          }
        }
      }

      if (round.riichiPlayers && round.riichiPlayers.length) {
        lines.push(`  立直玩家: ${round.riichiPlayers.join('、')}`);
      }

      if (round.playerSnapshots && round.playerSnapshots.length) {
        lines.push('  --- 结算后分数 ---');
        round.playerSnapshots.forEach(snapshot => {
          const delta = snapshot.delta || 0;
          const sign = delta >= 0 ? '+' : '';
          lines.push(`    ${snapshot.name || '玩家'}: ${sign}${formatScore(delta)} → ${formatScore(snapshot.finalScore || 0)}`);
        });
      }

      lines.push('');
    });
  }

  return lines.join('\n');
}

function buildMarkdownText(state) {
  if (!state) {
    return '暂无对局数据。';
  }

  const {
    gameSettings = {},
    players = [],
    gameState = {},
    roundHistory = [],
    isGameOver = false
  } = state;

  const exportDate = new Date().toLocaleString('zh-CN');
  const lines = [];

  lines.push('# 日本麻将对局记录\n');

  lines.push(`**导出时间**: ${exportDate}\n`);
  
  const typeLabel = typeMap[gameSettings.type] || '自定义对局';
  const rules = [];
  if (gameSettings.tobu) rules.push('击飞规则');
  if (gameSettings.useKlassicYaku) rules.push('古役');
  const rulesText = rules.length ? ` (${rules.join('、')})` : '';
  lines.push(`**对局类型**: ${typeLabel}${rulesText}`);
  const windLabel = windDisplay[gameState.wind] || '东';
  lines.push(`**当前进度**: ${windLabel}场 第 ${gameState.round || 1} 局 / ${gameState.honba || 0} 本场`);
  lines.push(`**立直棒**: ${gameState.riichiSticks || 0}`);
  lines.push(`**对局状态**: ${isGameOver ? '已结束' : '进行中'}`);
  lines.push(`**总记录数**: ${roundHistory.length}`);
  lines.push('');

  lines.push('## 玩家信息\n');
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sortedPlayers.forEach((player, index) => {
    const rank = index + 1;
    const rankSymbol = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📍';
    const name = player.name || `玩家${rank}`;
    lines.push(
      `${rankSymbol} **${rank}. ${name}** (${player.wind || ''})：**${formatScore(player.score || 0)}** 点${player.isRiichi ? ' `[立直中]`' : ''}`
    );
  });
  lines.push('');

  if (roundHistory.length) {
    lines.push('## 对局历史\n');
    roundHistory.forEach((round, idx) => {
      lines.push(`### 第 ${idx + 1} 局\n`);
      lines.push(`- **局数**: ${round.roundLabel || round.round || '未知'}`);
      lines.push(`- **类型**: ${round.type || '—'}`);

      if (round.type === '流局') {
        const tenpaiNames = (round.tenpaiPlayers && round.tenpaiPlayers.length)
          ? round.tenpaiPlayers.join('、')
          : '无';
        lines.push(`- **听牌玩家**: ${tenpaiNames}`);
      } else if (round.type === '多人和牌') {
        lines.push(`- **和牌者**: ${round.winner || '—'}`);
        if (round.loser) {
          lines.push(`- **放铳者**: ${round.loser}`);
        }
      } else {
        lines.push(`- **和牌者**: ${round.winner || '—'}`);
        if (round.loser && round.loser !== '—') {
          lines.push(`- **放铳者**: ${round.loser}`);
        }
        lines.push(`- **番符**: ${round.han || 0}番 ${round.fu || 0}符`);
        
        // 添加手牌信息
        if (round.handSnapshot) {
          const hs = round.handSnapshot;
          if (hs.handTiles && hs.handTiles.length) {
            lines.push(`- **手牌**: ${hs.handTiles.join(' ')}`);
          }
          if (hs.winTile) {
            lines.push(`- **和牌**: ${hs.winTile}`);
          }
          if (hs.melds && hs.melds.length) {
            const meldDescs = hs.melds.map(m => {
              const typeMap = { shuntsu: '顺子', pon: '刻子', minkan: '明杠', ankan: '暗杠' };
              return `${typeMap[m.type] || m.type}(${m.tiles.join('')})`;
            });
            lines.push(`- **副露**: ${meldDescs.join('、')}`);
          }
          if (hs.dora) {
            const doraItems = [];
            if (hs.dora.dora > 0) doraItems.push(`宝牌×${hs.dora.dora}`);
            if (hs.dora.uraDora > 0) doraItems.push(`里宝牌×${hs.dora.uraDora}`);
            if (hs.dora.redDora > 0) doraItems.push(`赤宝牌×${hs.dora.redDora}`);
            if (doraItems.length) {
              lines.push(`- **宝牌**: ${doraItems.join('、')}`);
            }
          }
        }
        
        // 添加役种信息
        if (round.scoreSummary && round.scoreSummary.yaku && round.scoreSummary.yaku.length) {
          lines.push(`- **役种**: ${round.scoreSummary.yaku.join('、')}`);
        }
      }

      if (round.playerSnapshots && round.playerSnapshots.length) {
        lines.push('\n**结算后分数**:\n');
        round.playerSnapshots.forEach(snapshot => {
          const delta = snapshot.delta || 0;
          const sign = delta >= 0 ? '+' : '';
          lines.push(`  - ${snapshot.name || '玩家'}: ${sign}${formatScore(delta)} → ${formatScore(snapshot.finalScore || 0)}`);
        });
      }

      lines.push('');
    });
  }

  return lines.join('\n');
}

function buildJSONText(state) {
  if (!state) {
    return '{}';
  }

  const output = {
    exportTime: new Date().toISOString(),
    gameSettings: state.gameSettings,
    gameState: state.gameState,
    isGameOver: state.isGameOver,
    players: state.players,
    roundHistory: state.roundHistory
  };

  return JSON.stringify(output, null, 2);
}

module.exports = {
  buildExportText,
  buildMarkdownText,
  buildJSONText
};