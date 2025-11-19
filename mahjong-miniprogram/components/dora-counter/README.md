# Dora Counter 组件修复说明

## 问题
用户反馈"看不到宝牌的选择和修改"

## 已完成的修复

### 1. WXML 结构 (index.wxml)
✅ 已恢复完整的可编辑结构:
- 减少按钮 `<button class="control-btn decrease">`
- 数值显示 `<view class="value-badge">`
- 增加按钮 `<button class="control-btn increase">`

### 2. WXSS 样式 (index.wxss)
✅ 已添加完整的按钮样式:
- `.control-btn.decrease` - 红色渐变
- `.control-btn.increase` - 蓝色渐变
- `.control-btn[disabled]` - 禁用状态
- `.value-badge` - 数值显示框

### 3. JS 逻辑 (index.js)
✅ 事件处理方法已存在:
- `onIncrease()` - 增加数值
- `onDecrease()` - 减少数值

## 组件使用示例

```xml
<dora-counter 
  label="宝牌" 
  value="{{singleWinDora.dora}}" 
  max="{{singleWinDoraLimits.dora}}" 
  data-type="dora" 
  bindchange="onDoraChange" 
/>
```

## 显示效果

```
┌─────────────────────┐
│      宝牌           │
│  [－]  2 / 4  [＋]  │
└─────────────────────┘
```

- 左侧红色 [－] 按钮: 减少数值
- 中间白色方框: 显示当前值/最大值
- 右侧蓝色 [＋] 按钮: 增加数值

## 调试建议

如果仍然看不到按钮,请尝试:

1. **重新编译小程序**
   - 在微信开发者工具中点击"编译"
   - 清除缓存后重新编译

2. **检查组件注册**
   - 确认 `pages/game/index.json` 中有注册 `dora-counter` 组件
   
3. **检查数据绑定**
   - 在 `pages/game/index.js` 中检查 `singleWinDora` 数据是否正确
   - 检查 `onDoraChange` 事件处理函数

4. **查看控制台**
   - 检查是否有报错信息
   - 检查组件是否正确加载

## 文件清单

修改的文件:
- ✅ `components/dora-counter/index.wxml` - 恢复按钮结构
- ✅ `components/dora-counter/index.wxss` - 更新按钮样式
- ✅ `components/dora-counter/index.js` - 已有完整逻辑

未修改的文件:
- `pages/game/index.wxml` - 使用方式正确
- `pages/game/index.wxss` - 样式正确
- `pages/game/index.js` - 需确认事件处理
