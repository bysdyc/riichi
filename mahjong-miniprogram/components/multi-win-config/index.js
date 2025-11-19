Component({
  properties: {
    players: {
      type: Array,
      value: []
    },
    winners: {
      type: Array,
      value: []
    },
    loserIndex: {
      type: Number,
      value: null
    },
    hanFuMap: {
      type: Object,
      value: {}
    },
    honba: {
      type: Number,
      value: 0
    }
  },
  data: {
    hanPresetValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 26],
    fuPresetValues: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    winnerConfigs: [],
    availableLosers: [],
    winnerActiveMap: {}
  },
  observers: {
    'winners, players, hanFuMap': function observeWinners(winners = [], players = [], hanFuMap = {}) {
      if (!Array.isArray(winners) || !Array.isArray(players)) {
        this.setData({
          winnerConfigs: [],
          availableLosers: [],
          winnerActiveMap: {}
        });
        return;
      }

      const validWinners = winners
        .map(idx => Number(idx))
        .filter(idx => Number.isInteger(idx) && idx >= 0 && idx < players.length);
      const winnerSet = new Set(validWinners);
      const activeMap = {};
      validWinners.forEach(idx => { activeMap[idx] = true; });

      const configs = validWinners
        .map(idx => {
          const player = players[idx] || {};
          const hanFu = hanFuMap[idx] || {};
          const hanValue = this.normalizeNumber(hanFu.han);
          const fuValue = this.normalizeNumber(hanFu.fu);
          return {
            index: idx,
            name: player.name || `玩家${idx + 1}`,
            wind: player.wind || '',
            hanValue,
            hanInput: hanValue == null ? '' : String(hanValue),
            fuValue,
            fuInput: fuValue == null ? '' : String(fuValue),
            hanLevel: this.getHanLevelLabel(hanValue),
            needsFu: !(hanValue != null && hanValue >= 13)
          };
        });

      const availableLosers = players
        .map((player = {}, idx) => ({
          index: idx,
          name: player.name || `玩家${idx + 1}`,
          wind: player.wind || ''
        }))
        .filter(option => !winnerSet.has(option.index));

      const currentLoser = this.properties.loserIndex;
      const loserValid = availableLosers.some(option => option.index === currentLoser);
      const shouldResetLoser = currentLoser != null && !loserValid;

      this.setData({
        winnerConfigs: configs,
        availableLosers,
        winnerActiveMap: activeMap
      });

      if (shouldResetLoser) {
        this.triggerEvent('loserchange', { index: null });
      }
    }
  },
  methods: {
    normalizeNumber(value) {
      if (value === '' || value === undefined || value === null) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    },

    getHanLevelLabel(han) {
      if (!Number.isFinite(han)) return '';
      if (han >= 78) return '六倍役满';
      if (han >= 65) return '五倍役满';
      if (han >= 52) return '四倍役满';
      if (han >= 39) return '三倍役满';
      if (han >= 26) return '双倍役满';
      if (han >= 13) return '役满';
      if (han >= 11) return '三倍满';
      if (han >= 8) return '倍满';
      if (han >= 6) return '跳满';
      if (han >= 5) return '满贯';
      return '';
    },

    onToggleWinner(evt) {
      const index = Number(evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      this.triggerEvent('togglewinner', { index });
    },

    onSelectLoser(evt) {
      const index = Number(evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      const next = this.properties.loserIndex === index ? null : index;
      this.triggerEvent('loserchange', { index: next });
    },

    onPresetHanTap(evt) {
      const dataset = evt.currentTarget && evt.currentTarget.dataset;
      if (!dataset) return;
      const index = Number(dataset.index);
      const value = Number(dataset.value);
      if (!Number.isInteger(index) || Number.isNaN(value)) return;
      this.triggerEvent('hanchange', { index, value });
    },

    onPresetFuTap(evt) {
      const dataset = evt.currentTarget && evt.currentTarget.dataset;
      if (!dataset) return;
      const index = Number(dataset.index);
      const value = Number(dataset.value);
      if (!Number.isInteger(index) || Number.isNaN(value)) return;
      this.triggerEvent('fuchange', { index, value });
    },

    onHanInput(evt) {
      const index = Number(evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      if (evt.detail && evt.detail.value !== undefined) {
        this.triggerEvent('hanchange', { index, value: evt.detail.value });
      }
    },

    onFuInput(evt) {
      const index = Number(evt.currentTarget.dataset.index);
      if (!Number.isInteger(index)) return;
      if (evt.detail && evt.detail.value !== undefined) {
        this.triggerEvent('fuchange', { index, value: evt.detail.value });
      }
    }
  }
});