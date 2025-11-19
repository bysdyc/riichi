Component({
  properties: {
    melds: {
      type: Array,
      value: []
    }
  },
  data: {
    typeLabels: {
      shuntsu: '顺子',
      pon: '刻子',
      minkan: '明杠',
      ankan: '暗杠'
    }
  },
  methods: {
    onRemove(evt) {
      const { index, id } = evt.currentTarget.dataset;
      if (index === undefined || index === null) return;
      this.triggerEvent('remove', { index, id });
    }
  }
});