Component({
  properties: {
    // 已选择的役种列表
    selectedYaku: {
      type: Array,
      value: []
    },
    // 是否有副露
    hasFuro: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 48个役种列表，按类别分组
    yakuList: [
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
      { id: 'renhou', name: '人和', han: 13, category: 'yakuman' },
      
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

    // 役种冲突规则
    conflictRules: {
      // 平和 vs 对对和/七对子
      'pinfu': ['toitoi', 'chiitoitsu'],
      'toitoi': ['pinfu', 'chiitoitsu'],
      'chiitoitsu': ['pinfu', 'toitoi', 'iipeikou', 'ryanpeikou', 'sanshoku_doujun', 'ittsu'],
      
      // 清一色 vs 混一色
      'chinitsu': ['honitsu'],
      'honitsu': ['chinitsu'],
      
      // 纯全 vs 混全
      'junchan': ['chanta'],
      'chanta': ['junchan'],
      
      // 两杯口 vs 一杯口/七对子
      'ryanpeikou': ['iipeikou', 'chiitoitsu'],
      'iipeikou': ['ryanpeikou', 'chiitoitsu'],
      
      // 立直 vs 双立直
      'riichi': ['double_riichi'],
      'double_riichi': ['riichi'],
      
      // 海底 vs 河底
      'haitei': ['houtei'],
      'houtei': ['haitei'],
      
      // 门前清自摸 vs 立直类（需要特殊处理）
      'tsumo': [],
      
      // 役满互斥
      'tenhou': ['chiihou', 'renhou'],
      'chiihou': ['tenhou', 'renhou'],
      'renhou': ['tenhou', 'chiihou']
    },

    // 需要门前的役种
    menzennYaku: [
      'riichi', 'double_riichi', 'ippatsu', 'tsumo', 
      'pinfu', 'iipeikou', 'ryanpeikou', 'chiitoitsu',
      'kokushi', 'kokushi13', 'chuuren', 'chuuren9',
      'suuankou', 'suuankou_tanki', 'tenhou', 'chiihou', 'renhou'
    ]
  },

  methods: {
    // 切换役种选择
    toggleYaku(e) {
      const yakuId = e.currentTarget.dataset.id;
      const yaku = this.data.yakuList.find(y => y.id === yakuId);
      
      if (!yaku) return;

      // 检查是否有副露且选择了门前役
      if (this.properties.hasFuro && this.data.menzennYaku.includes(yakuId)) {
        wx.showToast({
          title: `${yaku.name}需要门前`,
          icon: 'none',
          duration: 2000
        });
        return;
      }

      let selectedYaku = [...this.properties.selectedYaku];
      const index = selectedYaku.indexOf(yakuId);

      if (index > -1) {
        // 取消选择
        selectedYaku.splice(index, 1);
      } else {
        // 选择役种，检查冲突
        const conflicts = this.checkConflicts(yakuId, selectedYaku);
        
        if (conflicts.length > 0) {
          // 自动取消冲突的役种
          conflicts.forEach(conflictId => {
            const conflictIndex = selectedYaku.indexOf(conflictId);
            if (conflictIndex > -1) {
              selectedYaku.splice(conflictIndex, 1);
            }
          });
          
          // 显示提示
          const conflictNames = conflicts.map(id => {
            const conflictYaku = this.data.yakuList.find(y => y.id === id);
            return conflictYaku ? conflictYaku.name : id;
          }).join('、');
          
          wx.showToast({
            title: `已取消 ${conflictNames}`,
            icon: 'none',
            duration: 2000
          });
        }
        
        selectedYaku.push(yakuId);
      }

      // 计算总番数
      const totalHan = this.calculateTotalHan(selectedYaku);
      const hasConflict = this.hasAnyConflict(selectedYaku);

      // 触发事件通知父组件
      this.triggerEvent('change', {
        selectedYaku,
        totalHan,
        hasConflict
      });
    },

    // 检查单个役种的冲突
    checkConflicts(yakuId, selectedYaku) {
      const conflictRules = this.data.conflictRules[yakuId] || [];
      return selectedYaku.filter(id => conflictRules.includes(id));
    },

    // 检查是否存在任何冲突
    hasAnyConflict(selectedYaku) {
      for (let i = 0; i < selectedYaku.length; i++) {
        for (let j = i + 1; j < selectedYaku.length; j++) {
          const conflicts = this.data.conflictRules[selectedYaku[i]] || [];
          if (conflicts.includes(selectedYaku[j])) {
            return true;
          }
        }
      }
      return false;
    },

    // 计算总番数
    calculateTotalHan(selectedYaku) {
      const hasFuro = this.properties.hasFuro;
      let totalHan = 0;

      selectedYaku.forEach(yakuId => {
        const yaku = this.data.yakuList.find(y => y.id === yakuId);
        if (yaku) {
          // 如果有副露且该役种有副露减番，使用hanNaki
          if (hasFuro && yaku.hanNaki !== undefined) {
            totalHan += yaku.hanNaki;
          } else {
            totalHan += yaku.han;
          }
        }
      });

      return totalHan;
    },

    // 检查役种是否被选中
    isSelected(yakuId) {
      return this.properties.selectedYaku.includes(yakuId);
    },

    // 获取分类显示名称
    getCategoryName(category) {
      const names = {
        'yakuman': '役满',
        '6han': '6番役',
        '3han': '3番役',
        '2han': '2番役',
        '1han': '1番役'
      };
      return names[category] || category;
    },

    // 按类别分组役种
    getYakuByCategory(category) {
      return this.data.yakuList.filter(y => y.category === category);
    }
  }
});
