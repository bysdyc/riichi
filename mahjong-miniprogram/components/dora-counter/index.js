Component({
  properties: {
    label: {
      type: String,
      value: 'Dora'
    },
    value: {
      type: Number,
      value: 0
    },
    max: {
      type: Number,
      value: 12
    }
  },
  methods: {
    onIncrease() {
      if (this.data.value >= this.data.max) return;
      this.triggerEvent('change', { value: this.data.value + 1 });
      // 添加触觉反馈
      wx.vibrateShort({ type: 'light' });
    },
    onDecrease() {
      if (this.data.value <= 0) return;
      this.triggerEvent('change', { value: this.data.value - 1 });
      // 添加触觉反馈
      wx.vibrateShort({ type: 'light' });
    }
  }
});