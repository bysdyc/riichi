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
    drawType: {
      type: String,
      value: 'normal'
    },
    tenpaiSelection: {
      type: Array,
      value: []
    },
    nagashiSelection: {
      type: Array,
      value: []
    },
    showNagashi: {
      type: Boolean,
      value: false
    },
    scorePreview: {
      type: Object,
      value: null
    },
    scoreError: {
      type: String,
      value: ''
    }
  },

  data: {
    tenpaiActiveMap: {},
    nagashiActiveMap: {}
  },

  observers: {
    tenpaiSelection(value = []) {
      this.setData({ tenpaiActiveMap: this.buildActiveMap(value) });
    },
    nagashiSelection(value = []) {
      this.setData({ nagashiActiveMap: this.buildActiveMap(value) });
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        tenpaiActiveMap: this.buildActiveMap(this.properties.tenpaiSelection),
        nagashiActiveMap: this.buildActiveMap(this.properties.nagashiSelection)
      });
    }
  },

  methods: {
    noop() {},
    
    preventTouchMove(e) {
      // 阻止遮罩层的滚动穿透,但不影响内部 scroll-view
      return false;
    },

    buildActiveMap(list = []) {
      const map = {};
      (Array.isArray(list) ? list : []).forEach(idx => {
        const numeric = Number(idx);
        if (Number.isInteger(numeric) && numeric >= 0) {
          map[numeric] = true;
        }
      });
      return map;
    },

    onBackground() {
      this.onCancel();
    },

    onSelectType(evt) {
      const type = evt && evt.currentTarget && evt.currentTarget.dataset
        ? evt.currentTarget.dataset.type
        : '';
      if (!type) return;
      this.triggerEvent('toggletype', { type });
    },

    onToggleTenpai(evt) {
      const index = Number(evt.currentTarget && evt.currentTarget.dataset && evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      this.triggerEvent('toggletenpai', { index });
    },

    onToggleNagashi(evt) {
      const index = Number(evt.currentTarget && evt.currentTarget.dataset && evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      this.triggerEvent('togglenagashi', { index });
    },

    onToggleNagashiPanel() {
      this.triggerEvent('togglenagashipanel');
    },

    onConfirm() {
      this.triggerEvent('confirm');
    },

    onCancel() {
      this.triggerEvent('cancel');
    }
  }
});