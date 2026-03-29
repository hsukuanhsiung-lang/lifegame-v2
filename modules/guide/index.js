/**
 * Guide Module - 向导系统
 * 游戏指南、今日建议、契合度提升、任务推荐
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'guide';
  
  // Wiz 向导配置
  var WIZ_PERSONA = {
    name: 'Wiz',
    title: '灵魂向导',
    avatar: '🔮',
    desc: '来自里世界的神秘存在，引导你完成这场人生游戏'
  };
  
  // 游戏机制说明
  var GAME_MECHANICS = [
    {
      id: 'tasks',
      icon: '📋',
      title: '任务系统',
      shortDesc: '主线/支线任务的区别与完成技巧',
      fullDesc: '任务分为今日任务、长期任务和收集箱。今日任务当天有效，长期任务通过积累经验升级，收集箱用于暂存灵感。完成任务获得经验值，提升等级。',
      tips: [
        '主线任务推动人生进程，优先级最高',
        '支线任务丰富生活，提供额外经验',
        '长期任务通过每日子任务积累经验',
        '收集箱的任务记得及时整理归类'
      ]
    },
    {
      id: 'challenges',
      icon: '🔥',
      title: '每日挑战',
      shortDesc: '连续完成获得等级提升与契合度',
      fullDesc: '每日10项固定挑战：晨起仪式、冥想、健身、瑜伽、读书、日更vlog、记账、一生之誓、钢铁的心、夜终仪式。完成每项+1经验，全部完成+100经验和契合度提升。',
      tips: [
        '建议按固定顺序完成，形成习惯',
        '晨起仪式是开启一天的关键',
        '夜终仪式帮助复盘和安眠',
        '连续全勤可获得骰子宝箱'
      ]
    },
    {
      id: 'forbidden',
      icon: '🚫',
      title: '禁止事项',
      shortDesc: '戒断不良习惯，记录坚持天数',
      fullDesc: '10项禁止事项：戒烟、戒妄、戒色、戒槟榔、戒游戏、戒负债、戒糖、戒酒、戒冰水、戒烫水澡。每天坚守获得钻石，违规会扣除契合度。',
      tips: [
        'S级以上破戒不再掉级，但天数清零',
        '升级获得保护卡，可抵消一次惩罚',
        '钻石的唯一来源，非常珍贵',
        '全勤10项可获得额外骰子'
      ]
    },
    {
      id: 'levels',
      icon: '⭐',
      title: '等级系统',
      shortDesc: 'F到SSS的九级进阶之路',
      fullDesc: '等级从F(初心)到SSS(神话)共9级，每级都有独特的颜色和边框效果。长期任务完成指定经验后升级，禁止事项按坚持天数升级。',
      tips: [
        'F级灰色，SSS级彩虹渐变',
        'S级以上是高等级，有特权',
        '等级影响任务完成奖励',
        '颜色边框让任务一目了然'
      ]
    },
    {
      id: 'affinity',
      icon: '🔗',
      title: '契合度系统',
      shortDesc: '灵魂与肉体的连接强度',
      fullDesc: '契合度反映灵魂控制肉体的能力。完成挑战和禁止事项提升契合度，违规会降低。高契合度有奖励加成，低契合度需要更多努力。',
      tips: [
        '0-10%疏离，90-100%合一',
        '高契合度>70%有奖励加成',
        '连续完成有额外加成',
        '连续违规会加速下降'
      ]
    },
    {
      id: 'timeline',
      icon: '⏱️',
      title: '时间轨迹',
      shortDesc: '记录每一刻，见证时间重量',
      fullDesc: '24小时×15分钟的时间网格，用6种属性标记你的时间分配。生命、力量、智力、敏捷、自由、休息，六大维度记录你的人生轨迹。',
      tips: [
        '每格15分钟，4格=1小时',
        '记录满1小时转化为属性点',
        '可查看历史记录分析时间分配',
        '夜间时段可折叠，方便查看'
      ]
    }
  ];
  
  var GuideModule = {
    currentSection: null,
    
    // 事件处理器存储
    _eventHandlers: {},
    
    init: function() {
      LifeGame.log('[guide] 初始化');
      this.cleanup();
      this.bindEvents();
    },
    
    // 清理资源
    cleanup: function() {
      var container = document.getElementById('world-content');
      if (container && this._eventHandlers) {
        if (this._eventHandlers.click) {
          container.removeEventListener('click', this._eventHandlers.click);
        }
        container.dataset.guideEventsBound = '';
        this._eventHandlers = {};
      }
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:guide', function(data) {
        var module = LifeGame.getModule('guide');
        if (module) module.render();
      });
    },
    
    getData: function() {
      var storage = LifeGame.core.Storage.data;
      return {
        tasks: storage.tasks || [],
        challenges: storage.dailyChallenges || { completed: [] },
        forbiddens: storage.forbiddenItems || { records: {} },
        affinity: storage.affinity || { current: 0 },
        today: new Date().toISOString().split('T')[0]
      };
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('app');
      }
      if (!container) return;
      
      var data = this.getData();
      
      container.innerHTML = 
        '<div class="guide-container">' +
          this.renderWizSection(data) +
          this.renderTodayAdvice(data) +
          (this.currentSection ? this.renderDetailSection() : this.renderMechanicsGrid()) +
        '</div>';
      
      this.attachEvents();
    },
    
    // Wiz 向导区域
    renderWizSection: function(data) {
      var hour = new Date().getHours();
      var greeting = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安';
      var affinity = data.affinity.current;
      
      var messages = [
        greeting + '，灵魂行者。今日的挑战 awaits。',
        '记住，每一个15分钟都是成长的机会。',
        '契合度 ' + affinity + '%，' + this.getAffinityAdvice(affinity),
        '点击下方的指南卡片，了解游戏机制。'
      ];
      
      var randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      return '<div class="wiz-section">' +
        '<div class="wiz-avatar">' + WIZ_PERSONA.avatar + '</div>' +
        '<div class="wiz-content">' +
          '<div class="wiz-name">' + WIZ_PERSONA.name + ' · ' + WIZ_PERSONA.title + '</div>' +
          '<div class="wiz-message">' + randomMessage + '</div>' +
        '</div>' +
      '</div>';
    },
    
    getAffinityAdvice: function(affinity) {
      if (affinity < 30) return '你的灵魂正在努力控制肉体，不要放弃。';
      if (affinity < 50) return '连接正在加强，继续保持。';
      if (affinity < 70) return '控制稳定，可以尝试更有挑战的任务。';
      if (affinity < 90) return '你们已经紧密相连，奖励加成生效中。';
      return '完美的合一状态，你是自己肉体真正的主宰。';
    },
    
    // 今日建议
    renderTodayAdvice: function(data) {
      var advice = this.generateAdvice(data);
      
      var html = '<div class="guide-advice-section">' +
        '<div class="advice-header">' +
          '<span class="advice-icon">💡</span>' +
          '<span class="advice-title">今日建议</span>' +
        '</div>' +
        '<div class="advice-list">';
      
      advice.forEach(function(item) {
        html += '<div class="advice-item ' + item.type + '">' +
          '<span class="advice-type-icon">' + item.icon + '</span>' +
          '<span class="advice-text">' + item.text + '</span>' +
        '</div>';
      });
      
      html += '</div></div>';
      return html;
    },
    
    generateAdvice: function(data) {
      var advice = [];
      var today = new Date().toISOString().split('T')[0];
      
      // 检查未完成的挑战
      if (data.challenges && data.challenges.completed) {
        var completed = data.challenges.completed.filter(function(c) { return c.date === today; }).length;
        if (completed < 10) {
          advice.push({
            type: 'urgent',
            icon: '⚡',
            text: '还有 ' + (10 - completed) + ' 项每日挑战待完成，优先处理'
          });
        } else {
          advice.push({
            type: 'good',
            icon: '✓',
            text: '今日挑战全部完成，保持这个节奏！'
          });
        }
      }
      
      // 检查禁止事项
      if (data.forbiddens && data.forbiddens.records) {
        var todayRecords = data.forbiddens.records[today] || {};
        var violations = Object.values(todayRecords).filter(function(r) { return r.status === 'violated'; }).length;
        if (violations > 0) {
          advice.push({
            type: 'warning',
            icon: '⚠️',
            text: '今日有 ' + violations + ' 项违规，明天重新开始'
          });
        } else {
          advice.push({
            type: 'good',
            icon: '🛡️',
            text: '今日禁止事项全部坚守，意志如钢铁'
          });
        }
      }
      
      // 契合度建议
      if (data.affinity.current < 50) {
        advice.push({
          type: 'tip',
          icon: '🔗',
          text: '契合度较低，建议专注完成基础挑战提升连接'
        });
      }
      
      // 时间建议
      var hour = new Date().getHours();
      if (hour < 10) {
        advice.push({
          type: 'tip',
          icon: '🌅',
          text: '早晨是黄金时间，优先处理重要任务'
        });
      } else if (hour > 20) {
        advice.push({
          type: 'tip',
          icon: '🌙',
          text: '夜晚适合复盘和放松，准备夜终仪式'
        });
      }
      
      // 默认建议
      if (advice.length < 3) {
        advice.push({
          type: 'tip',
          icon: '🎯',
          text: '选择一项长期任务，每天推进一点点'
        });
      }
      
      return advice;
    },
    
    // 机制网格
    renderMechanicsGrid: function() {
      var html = '<div class="guide-mechanics">' +
        '<div class="mechanics-header">' +
          '<span class="mechanics-icon">📚</span>' +
          '<span class="mechanics-title">游戏机制指南</span>' +
        '</div>' +
        '<div class="mechanics-grid">';
      
      GAME_MECHANICS.forEach(function(mechanic) {
        html += '<div class="mechanic-card" data-mechanic="' + mechanic.id + '">' +
          '<div class="mechanic-icon">' + mechanic.icon + '</div>' +
          '<div class="mechanic-title">' + mechanic.title + '</div>' +
          '<div class="mechanic-desc">' + mechanic.shortDesc + '</div>' +
        '</div>';
      });
      
      html += '</div></div>';
      return html;
    },
    
    // 详情页
    renderDetailSection: function() {
      var mechanic = GAME_MECHANICS.find(function(m) { return m.id === this.currentSection; }, this);
      if (!mechanic) return this.renderMechanicsGrid();
      
      var tipsHtml = mechanic.tips.map(function(tip) {
        return '<li class="tip-item">' + tip + '</li>';
      }).join('');
      
      return '<div class="guide-detail">' +
        '<div class="detail-header">' +
          '<button class="detail-back" id="guide-back">← 返回</button>' +
          '<span class="detail-icon">' + mechanic.icon + '</span>' +
          '<span class="detail-title">' + mechanic.title + '</span>' +
        '</div>' +
        '<div class="detail-content">' +
          '<div class="detail-section">' +
            '<div class="detail-section-title">📖 机制说明</div>' +
            '<div class="detail-text">' + mechanic.fullDesc + '</div>' +
          '</div>' +
          '<div class="detail-section">' +
            '<div class="detail-section-title">💡 技巧提示</div>' +
            '<ul class="tips-list">' + tipsHtml + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    
    attachEvents: function() {
      var self = this;
      
      // 获取容器
      var container = document.getElementById('world-content');
      if (!container) return;
      
      // 防止重复绑定
      if (container.dataset.guideEventsBound === 'true') return;
      container.dataset.guideEventsBound = 'true';
      
      this._eventHandlers = {};
      
      // 事件委托
      this._eventHandlers.click = function(e) {
        // 返回按钮
        if (e.target.closest('#back-btn')) {
          LifeGame.emit('nav:back');
          return;
        }
        
        // 机制卡片点击
        var card = e.target.closest('.mechanic-card');
        if (card) {
          self.currentSection = card.dataset.mechanic;
          self.render(container);
          return;
        }
        
        // 向导返回按钮
        if (e.target.closest('#guide-back')) {
          self.currentSection = null;
          self.render(container);
          return;
        }
      };
      
      container.addEventListener('click', this._eventHandlers.click);
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, GuideModule);
})();
