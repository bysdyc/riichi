# 渐进式修复计划

## 🎯 修复策略

由于代码量巨大（1000+行），采用渐进式修复策略：

### 阶段1：架构修复（当前）
- 修复输入模式定义（auto/manual/expert/multi）
- 添加手动役种选择数据结构
- 添加状况役折叠状态

### 阶段2：UI组件修复
- 创建yaku-selector组件（手动役种选择）
- 优化tile-selector组件
- 添加副露管理UI

### 阶段3：逻辑完善
- 实现役种冲突检测
- 实现宝牌自动计算
- 实现状况役互斥逻辑

### 阶段4：功能补充
- 添加流局满贯
- 优化多人和牌
- 完善存档逻辑

---

## 📝 当前修复内容

### 1. game.js 数据结构扩展

```javascript
data: {
  // 修改：输入模式改为4种
  inputMode: 'expert',  // 'auto'|'manual'|'expert'|'multi'
  
  // 新增：手动役种模式相关
  manualYakuList: [],       // 已选择的役种ID数组
  manualFu: 40,             // 手动模式的符数
  manualYakuConflict: '',   // 役种冲突警告
  manualTotalHan: 0,        // 手动模式的总番数
  
  // 新增：状况役折叠状态
  yakuExpanded: false,      // 状况役是否展开
  
  // 新增：所有役种列表（用于手动选择）
  allYakuList: [
    // 役满
    { id: 'kokushi13', name: '国士无双十三面', han: 26, category: 'yakuman' },
    { id: 'kokushi', name: '国士无双', han: 13, category: 'yakuman' },
    { id: 'suuankou_tanki', name: '四暗刻单骑', han: 26, category: 'yakuman' },
    { id: 'suuankou', name: '四暗刻', han: 13, category: 'yakuman' },
    { id: 'daisangen', name: '大三元', han: 13, category: 'yakuman' },
    { id: 'daisuushii', name: '大四喜', han: 26, category: 'yakuman' },
    { id: 'shousuushii', name: '小四喜', han: 13, category: 'yakuman' },
    { id: 'tsuuiisou', name: '字一色', han: 13, category: 'yakuman' },
    { id: 'chinroutou', name: '清老头', han: 13, category: 'yakuman' },
    { id: 'ryuuiisou', name: '绿一色', han: 13, category: 'yakuman' },
    { id: 'chuuren9', name: '纯正九莲宝灯', han: 26, category: 'yakuman' },
    { id: 'chuuren', name: '九莲宝灯', han: 13, category: 'yakuman' },
    { id: 'tenhou', name: '天和', han: 13, category: 'yakuman' },
    { id: 'chiihou', name: '地和', han: 13, category: 'yakuman' },
    
    // 6番
    { id: 'chinitsu', name: '清一色', han: 6, hanNaki: 5, category: '6han' },
    
    // 3番
    { id: 'honitsu', name: '混一色', han: 3, hanNaki: 2, category: '3han' },
    { id: 'junchan', name: '纯全带幺九', han: 3, hanNaki: 2, category: '3han' },
    { id: 'ryanpeikou', name: '两杯口', han: 3, category: '3han' },
    
    // 2番
    { id: 'chiitoitsu', name: '七对子', han: 2, category: '2han' },
    { id: 'toitoi', name: '对对和', han: 2, category: '2han' },
    { id: 'sanankou', name: '三暗刻', han: 2, category: '2han' },
    { id: 'honroutou', name: '混老头', han: 2, category: '2han' },
    { id: 'shousangen', name: '小三元', han: 2, category: '2han' },
    { id: 'sanshoku_doujun', name: '三色同顺', han: 2, hanNaki: 1, category: '2han' },
    { id: 'sanshoku_doukou', name: '三色同刻', han: 2, category: '2han' },
    { id: 'ittsu', name: '一气通贯', han: 2, hanNaki: 1, category: '2han' },
    { id: 'chanta', name: '混全带幺九', han: 2, hanNaki: 1, category: '2han' },
    { id: 'double_riichi', name: '双立直', han: 2, category: '2han' },
    
    // 1番
    { id: 'riichi', name: '立直', han: 1, category: '1han' },
    { id: 'ippatsu', name: '一发', han: 1, category: '1han' },
    { id: 'tsumo', name: '门前清自摸和', han: 1, category: '1han' },
    { id: 'yakuhai_haku', name: '役牌:白', han: 1, category: '1han' },
    { id: 'yakuhai_hatsu', name: '役牌:发', han: 1, category: '1han' },
    { id: 'yakuhai_chun', name: '役牌:中', han: 1, category: '1han' },
    { id: 'yakuhai_ton', name: '役牌:东', han: 1, category: '1han' },
    { id: 'yakuhai_nan', name: '役牌:南', han: 1, category: '1han' },
    { id: 'yakuhai_shaa', name: '役牌:西', han: 1, category: '1han' },
    { id: 'yakuhai_pei', name: '役牌:北', han: 1, category: '1han' },
    { id: 'pinfu', name: '平和', han: 1, category: '1han' },
    { id: 'iipeikou', name: '一杯口', han: 1, category: '1han' },
    { id: 'tanyao', name: '断幺九', han: 1, category: '1han' },
    { id: 'haitei', name: '海底捞月', han: 1, category: '1han' },
    { id: 'houtei', name: '河底摸鱼', han: 1, category: '1han' },
    { id: 'rinshan', name: '岭上开花', han: 1, category: '1han' },
    { id: 'chankan', name: '抢杠', han: 1, category: '1han' }
  ],
  
  // 新增：流局满贯
  showNagashiMangan: false,
  nagashiManganPlayers: [false, false, false, false]
}
```

### 2. game.js 新增方法

```javascript
// 切换输入模式
switchInputMode(e) {
  const mode = e.currentTarget.dataset.mode;
  
  // 不同模式的数据重置逻辑
  const resetData = {
    inputMode: mode,
    analysisResult: null,
    analysisError: null,
    manualYakuList: [],
    manualYakuConflict: '',
    manualTotalHan: 0
  };
  
  if (mode === 'expert') {
    // 老手模式：清空手牌相关
    resetData.handTiles = [];
    resetData.melds = [];
    resetData.winTile = null;
  } else if (mode === 'multi') {
    // 多人和牌：重置相关数据
    resetData.multiLoserIndex = null;
    resetData.multiWinners = [false, false, false, false];
  }
  
  this.setData(resetData);
},

// 切换状况役折叠状态
toggleYakuExpanded() {
  this.setData({
    yakuExpanded: !this.data.yakuExpanded
  });
},

// 切换手动役种选择
toggleManualYaku(e) {
  const yakuId = e.currentTarget.dataset.id;
  let manualYakuList = [...this.data.manualYakuList];
  
  if (manualYakuList.includes(yakuId)) {
    // 取消选择
    manualYakuList = manualYakuList.filter(id => id !== yakuId);
  } else {
    // 添加选择
    manualYakuList.push(yakuId);
  }
  
  this.setData({ manualYakuList });
  
  // 检测冲突和计算总番数
  this.checkManualYakuConflict();
  this.calculateManualTotalHan();
},

// 检测役种冲突
checkManualYakuConflict() {
  const selected = this.data.manualYakuList;
  const conflicts = [
    ['pinfu', 'toitoi', '平和与对对和冲突'],
    ['pinfu', 'chiitoitsu', '平和与七对子冲突'],
    ['iipeikou', 'chiitoitsu', '一杯口与七对子冲突'],
    ['ryanpeikou', 'chiitoitsu', '两杯口与七对子冲突'],
    ['riichi', 'double_riichi', '立直与双立直冲突'],
    ['haitei', 'houtei', '海底与河底冲突'],
    ['tsumo', 'houtei', '自摸与河底冲突'],
    ['tsumo', 'chankan', '自摸与抢杠冲突']
  ];
  
  for (const [yaku1, yaku2, message] of conflicts) {
    if (selected.includes(yaku1) && selected.includes(yaku2)) {
      this.setData({ manualYakuConflict: message });
      return;
    }
  }
  
  this.setData({ manualYakuConflict: '' });
},

// 计算手动模式总番数
calculateManualTotalHan() {
  const selected = this.data.manualYakuList;
  const hasMeld = this.data.melds.length > 0;
  let totalHan = 0;
  
  selected.forEach(yakuId => {
    const yaku = this.data.allYakuList.find(y => y.id === yakuId);
    if (yaku) {
      // 考虑副露影响
      if (hasMeld && yaku.hanNaki !== undefined) {
        totalHan += yaku.hanNaki;
      } else {
        totalHan += yaku.han;
      }
    }
  });
  
  this.setData({ manualTotalHan: totalHan });
},

// 删除单个副露
removeMeld(e) {
  const index = e.currentTarget.dataset.index;
  const melds = [...this.data.melds];
  melds.splice(index, 1);
  this.setData({ melds });
},

// 清空所有副露
clearMelds() {
  this.setData({ melds: [] });
},

// 删除手牌
removeHandTile(e) {
  const index = e.currentTarget.dataset.index;
  const handTiles = [...this.data.handTiles];
  handTiles.splice(index, 1);
  this.setData({ handTiles });
},

// 切换流局满贯
toggleNagashiMangan() {
  this.setData({
    showNagashiMangan: !this.data.showNagashiMangan
  });
},

// 切换流局满贯玩家
toggleNagashiManganPlayer(e) {
  const index = e.currentTarget.dataset.index;
  const key = `nagashiManganPlayers[${index}]`;
  this.setData({
    [key]: !this.data.nagashiManganPlayers[index]
  });
}
```

---

## 🚀 下一步操作

由于代码量巨大，建议：

1. **先阅读 FIXES_NEEDED.md**，全面了解所有问题
2. **逐个模块修复**，避免一次性修改导致混乱
3. **每次修复后测试**，确保功能正常
4. **参考原HTML代码**，确保逻辑一致

---

## ⚠️ 重要提示

当前小程序代码有很多与原HTML不一致的地方，主要问题：

1. **输入模式混乱**：'hand'/'manual'不对应原HTML的3种模式
2. **缺少手动役种选择**：完全没有这个功能
3. **副露管理不完整**：无法删除、清空
4. **状况役无折叠**：一直展开占用空间
5. **宝牌无自动计算**：需要手动输入
6. **流局满贯缺失**：无法处理特殊流局

建议按照 FIXES_NEEDED.md 的优先级逐步修复。
