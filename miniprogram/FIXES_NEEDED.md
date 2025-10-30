# 小程序深度修复方案

## 🎯 核心问题分析

### 1. 输入模式架构问题 ⚠️ **严重**

#### 原HTML的设计（正确）
```
模式1: 自动分析 (!isManualMode && !isExpertMode)
  - 手牌输入 + 副露 + 和牌 + 状况役
  - 点击"分析"按钮自动识别役种
  - 系统计算番数和符数
  
模式2: 手动役种 (isManualMode && !isExpertMode)
  - 手牌输入 + 副露 + 和牌 + 状况役
  - 手动勾选役种（多选）
  - 手动输入符数
  - 系统根据选择计算番数
  
模式3: 老手模式 (isExpertMode)
  - 不需要手牌输入
  - 直接输入番数 + 符数
  - 快速记录

模式4: 多人和牌
  - 独立的UI和逻辑
  - 选择放铳者 + 多个和牌者
  - 为每人输入番符
```

#### 当前小程序的问题（错误）
```
❌ 'hand'模式 = 混淆了自动分析和手动役种
❌ 'manual'模式 = 老手模式但缺少手动役种功能
❌ 缺少真正的"手动役种选择"功能
❌ 没有役种冲突检测
```

#### 修复方案
```
✅ 'auto' = 自动分析模式
✅ 'manual' = 手动役种模式（新增完整UI）
✅ 'expert' = 老手快速输入
✅ 'multi' = 多人和牌
```

---

### 2. 手牌输入界面布局问题 ⚠️ **严重**

#### 原HTML的布局（正确）
```
┌─────────────────────────────────────┐
│ 模式切换: [自动分析] [手动役种] [老手] │
├─────────────────────────────────────┤
│ 手牌区 (13张，可点击删除)            │
│ [1万][2万][3万]...                  │
├─────────────────────────────────────┤
│ 副露区                               │
│ 顺子: [1万][2万][3万] [删除]        │
│ 碰: [东][东][东] [删除]             │
│ [清空副露]                           │
├─────────────────────────────────────┤
│ 和牌: [5万]                         │
├─────────────────────────────────────┤
│ 牌选择器 (分类显示)                 │
│ 万: [1万] [2万] ...                 │
│ 筒: [1筒] [2筒] ...                 │
│ 索: [1索] [2索] ...                 │
│ 字: [东] [南] ...                   │
│ 已选 3/13                           │
├─────────────────────────────────────┤
│ 副露操作                             │
│ [顺子] [碰] [明杠] [暗杠]           │
├─────────────────────────────────────┤
│ 状况役 (默认折叠) [展开▼]           │
│ ☑立直 ☐一发 ☐双立直 ...            │
├─────────────────────────────────────┤
│ [分析牌型] 按钮                      │
├─────────────────────────────────────┤
│ 分析结果:                            │
│ 役种: 清一色 对对和                 │
│ 9番 40符                            │
└─────────────────────────────────────┘
```

#### 当前小程序的问题
```
❌ 缺少副露删除按钮
❌ 缺少清空副露按钮
❌ 缺少手牌点击删除功能
❌ 状况役没有折叠功能
❌ 牌选择器样式不够清晰
```

---

### 3. 手动役种选择功能 ⚠️ **完全缺失**

#### 原HTML的设计
```html
<!-- 役满 -->
<div class="yaku-section">
  <h4>役满</h4>
  <label><input type="checkbox" value="kokushi"> 国士无双 (13番)</label>
  <label><input type="checkbox" value="suuankou"> 四暗刻 (13番)</label>
  ...
</div>

<!-- 6番 -->
<div class="yaku-section">
  <h4>6番</h4>
  <label><input type="checkbox" value="chinitsu"> 清一色 (门前6/副露5)</label>
</div>

<!-- 显示冲突警告 -->
<div class="conflict-warning">
  ⚠️ 平和与对对和冲突！
</div>

<!-- 显示总番数 -->
<div class="total-han">
  总番数: 5番
</div>
```

#### 需要实现
```
✅ 40+役种的复选框列表
✅ 按分类显示（役满/6番/3番/2番/1番）
✅ 实时冲突检测
✅ 实时总番数计算
✅ 副露影响番数的处理
```

---

### 4. 副露管理功能 ⚠️ **不完整**

#### 原HTML的功能
```javascript
// 添加副露
addMeld('shuntsu', '1m') // 添加顺子
addMeld('pon', '1z')     // 添加碰
addMeld('minkan', '5p')  // 添加明杠
addMeld('ankan', '7s')   // 添加暗杠

// 删除单个副露
removeMeld(index)

// 清空所有副露
clearMelds()

// 显示副露详情
melds.forEach(meld => {
  // 显示: 类型 + 牌 + 删除按钮
})
```

#### 当前小程序的问题
```
❌ 没有删除单个副露的UI
❌ 没有清空副露的按钮
❌ 副露显示不够直观
```

---

### 5. 状况役交互逻辑 ⚠️ **中等**

#### 原HTML的逻辑
```javascript
// 默认折叠
isYakuExpanded = false;

// 互斥关系
if (isDoubleRiichi) isRiichi = false; // 双立直和立直互斥
if (isHaitei) isHoutei = false;       // 海底和河底互斥
if (isRinshan) {
  isHaitei = false;
  isHoutei = false;
}

// 前置条件
if (isIppatsu && !isRiichi && !isDoubleRiichi) {
  // 一发需要立直
  showToast('一发需要立直或双立直');
  isIppatsu = false;
}

// 天和/地和/人和互斥
// 只能选一个
```

#### 需要实现
```
✅ 默认折叠，点击展开/收起
✅ 互斥关系检查
✅ 前置条件检查
✅ Toast提示
```

---

### 6. 宝牌自动计算 ⚠️ **中等**

#### 原HTML的功能
```javascript
// 自动计算红宝牌
const calculateRedDoraInfo = () => {
  // 统计手牌+副露中的红五万/筒/索
  let redCount = 0;
  handTiles.forEach(t => {
    if (t === '0m' || t === '0p' || t === '0s') redCount++;
  });
  melds.forEach(m => {
    m.tiles.forEach(t => {
      if (t === '0m' || t === '0p' || t === '0s') redCount++;
    });
  });
  return { redCount, maxRed: redCount };
};

// 自动调整
autoAdjustRedDora();

// 里宝只有立直时可用
if (!isRiichi && !isDoubleRiichi) {
  uraDora = 0;
  // 禁用里宝输入
}
```

#### 需要实现
```
✅ 红宝自动计算（基于手牌）
✅ 里宝受立直限制
✅ 实时点数预览
```

---

### 7. 多人和牌优化 ⚠️ **中等**

#### 原HTML的流程
```
1. 进入多人和牌模式
2. 先选择放铳者（必须）
3. 勾选和牌者（2-3人，不能是放铳者）
4. 为每个和牌者输入番符
5. 显示点数分配预览
6. 确认结算
```

#### 当前小程序
```
基本功能已有，但需要优化：
✅ UI更清晰
✅ 错误提示更友好
✅ 点数预览更详细
```

---

### 8. 流局满贯 ⚠️ **缺失**

#### 原HTML的功能
```html
<div class="nagashi-mangan-section">
  <h4>流局满贯 (展开)</h4>
  <label><input type="checkbox"> 甲</label>
  <label><input type="checkbox"> 乙</label>
  <label><input type="checkbox"> 丙</label>
  <label><input type="checkbox"> 丁</label>
</div>
```

#### 需要实现
```
✅ 流局时可选流局满贯
✅ 可多选玩家
✅ 按满贯计算点数
✅ 其他玩家平分点数
```

---

### 9. 游戏流程和存档 ⚠️ **需检查**

#### 原HTML的逻辑
```javascript
// 自动保存（结算后）
const saveGameState = () => {
  localStorage.setItem('mahjong_game_state', JSON.stringify({
    gameSettings,
    players,
    gameState,
    currentDealerIndex,
    roundHistory,
    isGameOver
  }));
};

// 自动加载（页面加载时）
const loadGameState = () => {
  const saved = localStorage.getItem('mahjong_game_state');
  if (saved) {
    // 恢复游戏状态
  }
};

// 连庄/轮庄逻辑
const goToNextRound = (dealerContinuation) => {
  if (dealerContinuation) {
    // 连庄：本场+1
    gameState.honba++;
  } else {
    // 轮庄
    if (gameState.round === 4) {
      // 换风或结束
    } else {
      gameState.round++;
      gameState.honba = 0;
    }
  }
};
```

#### 需要检查
```
✅ 存档保存时机正确
✅ 连庄/轮庄逻辑正确
✅ 飞び规则正确
```

---

## 📋 优先级修复清单

### P0 - 紧急（影响核心功能）
1. ✅ 修复输入模式架构（4种模式）
2. ✅ 实现手动役种选择UI和逻辑
3. ✅ 完善副露管理（删除、清空）
4. ✅ 修复手牌输入界面布局

### P1 - 重要（影响用户体验）
5. ✅ 状况役折叠和互斥逻辑
6. ✅ 宝牌自动计算
7. ✅ 多人和牌UI优化
8. ✅ 流局满贯功能

### P2 - 次要（细节优化）
9. ✅ 牌选择器样式优化
10. ✅ 点数预览实时更新
11. ✅ Toast提示系统
12. ✅ 历史记录格式优化

---

## 🔧 技术实现方案

### 手动役种选择组件

```javascript
// yaku-selector组件
Component({
  properties: {
    melds: Array,  // 副露数组，判断门前/副露
    selected: Array  // 已选役种
  },
  data: {
    yakuList: [
      // 役满
      { id: 'kokushi13', name: '国士无双十三面', han: 26, category: 'yakuman' },
      // ... 40+役种
    ],
    conflicts: [
      ['pinfu', 'toitoi'],  // 平和 vs 对对和
      ['iipeikou', 'chiitoitsu'],  // 一杯口 vs 七对子
      // ... 更多冲突规则
    ],
    totalHan: 0,
    conflictWarning: ''
  },
  methods: {
    toggleYaku(yakuId) {
      // 切换选择
      // 检测冲突
      // 更新总番数
    },
    checkConflicts() {
      // 检测并显示冲突
    },
    calculateTotalHan() {
      // 计算总番数（考虑副露影响）
    }
  }
})
```

### 状况役折叠

```wxml
<view class="yaku-section">
  <view class="yaku-header" bindtap="toggleYakuExpanded">
    <text>状况役设置</text>
    <text class="expand-icon">{{yakuExpanded ? '▲' : '▼'}}</text>
  </view>
  <view class="yaku-body" wx:if="{{yakuExpanded}}">
    <!-- 状况役选项 -->
  </view>
</view>
```

### 副露管理

```wxml
<view class="melds-area">
  <view class="meld-item" wx:for="{{melds}}" wx:key="index">
    <text>{{item.type}}: </text>
    <text wx:for="{{item.tiles}}" wx:key="*this">{{item}}</text>
    <button bindtap="removeMeld" data-index="{{index}}">删除</button>
  </view>
  <button bindtap="clearMelds" wx:if="{{melds.length > 0}}">清空副露</button>
</view>
```

---

## 📝 测试检查清单

### 模式切换测试
- [ ] 自动分析 → 手动役种：数据清空
- [ ] 手动役种 → 老手：隐藏手牌区
- [ ] 老手 → 多人和牌：切换UI
- [ ] 任意模式 → 返回：恢复正确模式

### 手牌输入测试
- [ ] 选择13张手牌成功
- [ ] 添加顺子副露：手牌-3
- [ ] 添加碰副露：手牌-3
- [ ] 添加明杠副露：手牌-4
- [ ] 添加暗杠副露：手牌-4
- [ ] 删除单个副露：恢复手牌数
- [ ] 清空副露：恢复所有手牌数
- [ ] 选择和牌成功
- [ ] 点击手牌删除成功

### 手动役种测试
- [ ] 选择单个役种：总番数正确
- [ ] 选择多个役种：总番数累加
- [ ] 选择冲突役种：显示警告
- [ ] 副露影响番数：自动调整
- [ ] 门前役被禁用：有副露时

### 状况役测试
- [ ] 默认折叠状态
- [ ] 点击展开/收起
- [ ] 双立直和立直互斥
- [ ] 一发需要立直前置
- [ ] 海底和河底互斥
- [ ] 岭上和海底/河底互斥

### 宝牌测试
- [ ] 红宝自动计算正确
- [ ] 无立直时里宝为0
- [ ] 点数预览实时更新

### 多人和牌测试
- [ ] 必须先选放铳者
- [ ] 和牌者不能是放铳者
- [ ] 2-3人和牌限制
- [ ] 点数分配正确
- [ ] 立直棒分配正确

### 流局测试
- [ ] 普通流局：3000点分配
- [ ] 流局满贯：满贯点数计算
- [ ] 立直棒保留到下局
- [ ] 开局流局：点数不变

### 游戏流程测试
- [ ] 和牌后连庄/轮庄正确
- [ ] 本场数累加正确
- [ ] 风圈切换正确
- [ ] 飞び规则触发
- [ ] 游戏结束判断
- [ ] 存档保存和加载

---

## 💡 关键修复代码片段

### 输入模式切换

```javascript
switchInputMode(e) {
  const mode = e.currentTarget.dataset.mode;
  
  // 切换模式时清空相关数据
  const resetData = {
    inputMode: mode,
    analysisResult: null,
    analysisError: null
  };
  
  if (mode === 'auto' || mode === 'manual') {
    // 自动分析和手动役种模式：保留手牌数据
    resetData.han = 1;
    resetData.fu = 30;
  } else if (mode === 'expert') {
    // 老手模式：清空手牌
    resetData.handTiles = [];
    resetData.melds = [];
    resetData.winTile = null;
  } else if (mode === 'multi') {
    // 多人和牌模式
    resetData.multiLoserIndex = null;
    resetData.multiWinners = [false, false, false, false];
  }
  
  this.setData(resetData);
}
```

### 役种冲突检测

```javascript
checkYakuConflicts(selectedYakuIds) {
  const conflicts = [
    ['pinfu', 'toitoi'],
    ['pinfu', 'chiitoitsu'],
    ['iipeikou', 'chiitoitsu'],
    ['ryanpeikou', 'chiitoitsu'],
    ['riichi', 'double_riichi'],
    ['haitei', 'houtei'],
    ['tsumo', 'houtei'],
    ['tsumo', 'chankan']
  ];
  
  for (const [yaku1, yaku2] of conflicts) {
    if (selectedYakuIds.includes(yaku1) && selectedYakuIds.includes(yaku2)) {
      return `${yaku1}和${yaku2}冲突！`;
    }
  }
  
  return null;
}
```

---

这个修复方案涵盖了原HTML版本和小程序版本之间的所有差异。
现在需要按照优先级逐个实施这些修复。
