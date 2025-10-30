# 完全重写执行指南

## 🎯 重写策略

由于game.js文件过大（1000+行），完全重写需要3000+行代码，不适合一次性操作。

采用**模块化重写**策略：

1. 保留原有的框架和基础方法
2. 重点修改和添加关键功能
3. 逐模块测试和验证

---

## 📋 关键修改清单

### 1. data对象修改 ✅ CRITICAL

**位置**：game.js 第6-115行

**需要修改**：
```javascript
// 修改输入模式定义
inputMode: 'expert', // 从'manual'改为'expert'，并添加'auto'选项

// 新增：手动役种模式相关 (第28行后添加)
expertHan: 1,
expertFu: 30,

// 新增：手动役种选择相关 (第50行后添加)
manualYakuList: [],
manualFu: 40,
manualYakuConflict: '',
manualTotalHan: 0,

// 新增：状况役折叠 (第48行后添加)
yakuExpanded: false,

// 新增：宝牌相关 (第39行后添加)
maxRedDora: 0,

// 新增：流局满贯 (第90行后添加)
showNagashiMangan: false,
nagashiManganPlayers: [false, false, false, false],

// 新增：完整役种列表 (第50行后添加，约60行)
allYakuList: [ ... 40+役种定义 ... ]
```

### 2. 新增方法 ✅ CRITICAL

**位置**：game.js 第200行后添加

**需要添加的方法**：

```javascript
// ========== 输入模式相关 ==========
switchInputMode(e) { ... }

// ========== 手动役种选择 ==========
toggleManualYaku(e) { ... }
checkManualYakuConflict() { ... }
calculateManualTotalHan() { ... }

// ========== 状况役交互 ==========
toggleYakuExpanded() { ... }
toggleYakuWithCheck(yakuType) { ... }  // 带互斥检查的状况役切换

// ========== 副露管理 ==========
removeMeld(e) { ... }
clearMelds() { ... }
removeHandTile(e) { ... }

// ========== 宝牌计算 ==========
calculateRedDora() { ... }
autoAdjustRedDora() { ... }
updatePointsPreview() { ... }

// ========== 流局满贯 ==========
toggleNagashiMangan() { ... }
toggleNagashiManganPlayer(e) { ... }

// ========== 手牌分析增强 ==========
analyzeHand() { ... }  // 修改现有方法
```

### 3. WXML重构 ✅ CRITICAL

**位置**：game.wxml 全文

**需要重构的部分**：

1. **模式切换按钮** (第1-20行)
   - 4个按钮：自动分析、手动役种、老手模式、多人和牌
   - 高亮显示当前模式

2. **Auto模式UI** (第21-150行)
   - 手牌显示区（可点击删除）
   - 副露显示区（可删除、清空）
   - 和牌显示
   - 牌选择器
   - 副露按钮组
   - 状况役设置（可折叠）
   - 分析按钮
   - 分析结果显示

3. **Manual模式UI** (第151-300行)
   - 手牌显示区（同Auto）
   - 副露显示区（同Auto）
   - 和牌显示（同Auto）
   - **役种选择区**（新增，分类显示40+役种）
   - 符数选择
   - 冲突警告显示
   - 总番数显示

4. **Expert模式UI** (第301-400行)
   - 番数输入
   - 符数选择
   - 宝牌输入
   - 点数预览

5. **Multi模式UI** (第401-500行)
   - 放铳者选择
   - 和牌者勾选
   - 每人番符输入
   - 点数预览

### 4. WXSS样式优化 ✅ HIGH

**位置**：game.wxss 全文

**需要添加的样式**：

```css
/* 模式切换按钮 */
.mode-switch { ... }
.mode-button { ... }
.mode-button-active { ... }

/* 手牌可删除 */
.hand-tile-deletable { ... }
.hand-tile-delete-icon { ... }

/* 副露管理 */
.meld-item { ... }
.meld-delete-btn { ... }
.meld-clear-btn { ... }

/* 状况役折叠 */
.yaku-section { ... }
.yaku-header { ... }
.yaku-body { ... }
.expand-icon { ... }

/* 役种选择列表 */
.yaku-category { ... }
.yaku-checkbox-list { ... }
.yaku-checkbox-item { ... }
.yaku-conflict-warning { ... }
.yaku-total-han { ... }

/* 点数预览 */
.points-preview { ... }
```

---

## 🔧 具体执行步骤

由于完整重写代码量过大，我建议分步骤执行：

### 步骤1：准备工作 ✅
- [x] 备份原game.js
- [x] 创建详细修改指南
- [ ] 阅读并理解原HTML的完整逻辑

### 步骤2：核心功能修改 🔄
- [ ] 修改data对象（添加新字段）
- [ ] 添加核心方法（20个新方法）
- [ ] 修改现有方法（5个方法增强）

### 步骤3：UI重构 🔄
- [ ] 重构WXML（4种模式UI）
- [ ] 优化WXSS（新增样式）
- [ ] 创建yaku-selector组件

### 步骤4：测试验证 ⏳
- [ ] 测试4种模式切换
- [ ] 测试手牌输入和分析
- [ ] 测试副露管理
- [ ] 测试役种选择
- [ ] 测试多人和牌
- [ ] 测试流局和满贯
- [ ] 测试游戏流程

---

## 💡 推荐方案

**由于代码量巨大（预计需要修改/新增2000+行代码），我建议：**

### 方案A：分批次修复（推荐）
1. **第一批**：修复输入模式架构 + 副露管理（30分钟）
2. **第二批**：实现手动役种选择（1小时）
3. **第三批**：完善其他功能（1小时）

### 方案B：关键功能优先
只修复最影响使用的3-4个功能：
1. 输入模式架构
2. 副露管理（删除/清空）
3. 状况役折叠
4. 手动役种选择（简化版）

### 方案C：参考指南手动修改
我提供详细的代码片段，你手动复制粘贴到IDE中修改

---

## ❓ 请选择

由于完全自动重写会生成3000+行代码，可能导致文件混乱，请告诉我：

1. **选择方案A**：我逐批次帮你修改（每批测试一次）
2. **选择方案B**：只修复关键功能
3. **选择方案C**：我提供代码片段，你手动修改
4. **继续自动重写**：我继续生成完整代码（可能很长）

---

当前建议：**选择方案A** - 分批次修复，确保每一步都正确。
