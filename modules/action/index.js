/**
 * Action Module - 行动系统 (整合时间轨迹)
 * 包含：属性选择、行动列表、时间轨迹视图
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'action';
  
  // 6属性配置
  var ATTRS = [
    { key: 'life', name: '生命', icon: '🧬', color: '#ff9500', desc: '洗漱、吃饭、家务、交通' },
    { key: 'power', name: '力量', icon: '💪', color: '#ff3b5c', desc: '健身、力量训练、举重' },
    { key: 'intel', name: '智力', icon: '🧠', color: '#4a9eff', desc: '读书、学习、编程、冥想' },
    { key: 'agile', name: '敏捷', icon: '🤺', color: '#32d74b', desc: '瑜伽、有氧、跑步、运动' },
    { key: 'free', name: '自由', icon: '🎨', color: '#a855f7', desc: '工作、剪辑、创作、开发' },
    { key: 'rest', name: '休息', icon: '😴', color: '#6e6e82', desc: '睡觉、娱乐、发呆、放松' }
  ];
  
  var DEFAULT_ACTIONS = {
    life: [
      { id: 'a1', name: '洗漱', icon: '🧼' },
      { id: 'a2', name: '家务', icon: '🧹' },
      { id: 'a3', name: '做饭', icon: '🍳' },
      { id: 'a4', name: '整理', icon: '🚿' }
    ],
    power: [
      { id: 'a5', name: '健身', icon: '🏋️' },
      { id: 'a6', name: '跑步', icon: '⚡' },
      { id: 'a7', name: '举重', icon: '🏌️' },
      { id: 'a8', name: '瑜伽', icon: '🧘' }
    ],
    intel: [
      { id: 'a9', name: '读书', icon: '📚' },
      { id: 'a10', name: '写作', icon: '✍️' },
      { id: 'a11', name: '冥想', icon: '🧘' },
      { id: 'a12', name: '学习', icon: '📖' }
    ],
    agile: [
      { id: 'a13', name: '篮球', icon: '🏀' },
      { id: 'a14', name: '足球', icon: '⚽' },
      { id: 'a15', name: '跳绳', icon: '🦾' },
      { id: 'a16', name: '舞蹈', icon: '💃' }
    ],
    free: [
      { id: 'a17', name: '编程', icon: '💻' },
      { id: 'a18', name: '剪辑', icon: '🎬' },
      { id: 'a19', name: '创作', icon: '🎨' },
      { id: 'a20', name: '工作', icon: '💼' }
    ],
    rest: [
      { id: 'a21', name: '睡眠', icon: '😴' },
      { id: 'a22', name: '放松', icon: '🌅' },
      { id: 'a23', name: '游戏', icon: '🎮' },
      { id: 'a24', name: '发呆', icon: '💭' }
    ]
  };
  
  var ActionModule = {
    currentAttr: null,
    currentView: 'attr',
    _lastContainer: null,
    tlCurrentDate: null,
    tlSelectedAttr: null,
    tlNightExpanded: false,
    customActions: null,
    pendingTimerRecord: null,
    
    /**
     * 初始化模块
     */
    init: function() {
      LifeGame.log('[action] 初始化');
      this.tlCurrentDate = this.getTodayStr();
      this.loadCustomActions();
      this.cleanup();
      this.bindEvents();
    },
    
    /**
     * 清理资源
     */
    cleanup: function() {
      if (this._hideEditBtnsHandler) {
        document.removeEventListener('click', this._hideEditBtnsHandler);
        this._hideEditBtnsHandler = null;
      }
      
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
        this.renderTimeout = null;
      }
      
      var container = this._lastContainer;
      if (container) {
        container.dataset.attrEventsBound = '';
        container.dataset.actionListEventsBound = '';
        container.dataset.timelineEventsBound = '';
      }
    },
    
    /**
     * 加载自定义行动
     */
    loadCustomActions: function() {
      var storage = LifeGame.core.Storage.data;
      this.customActions = storage.customActions || {};
      
      ATTRS.forEach(function(attr) {
        if (!this.customActions[attr.key]) {
          this.customActions[attr.key] = JSON.parse(JSON.stringify(DEFAULT_ACTIONS[attr.key] || []));
        }
      }.bind(this));
    },
    
    /**
     * 保存自定义行动
     */
    saveCustomActions: function() {
      LifeGame.core.Storage.set('customActions', this.customActions);
      LifeGame.emit('action:updated', { actions: this.customActions });
    },
    
    /**
     * 获取行动列表
     * @param {string} attrKey - 属性键
     * @returns {Array} 行动列表
     */
    getActions: function(attrKey) {
      return this.customActions[attrKey] || DEFAULT_ACTIONS[attrKey] || [];
    },
    
    /**
     * 绑定事件
     */
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:action', function(data) {
        var module = LifeGame.getModule('action');
        if (module) module.render();
      });
    },
    
    /**
     * 渲染视图
     * @param {HTMLElement} container - 渲染容器
     */
    render: function(container) {
      if (!container) {
        container = this._lastContainer || document.getElementById('world-content') || document.getElementById('app');
      }
      if (!container) return;
      
      this._lastContainer = container;
      
      if (this.currentView === 'timeline') {
        this.renderTimelineView(container);
      } else if (this.currentAttr) {
        this.renderActionList(container);
      } else {
        this.renderAttrSelect(container);
      }
    },
    
    /**
     * 渲染视图切换标签
     * @param {string} activeView - 当前视图
     * @returns {string} HTML字符串
     */
    renderViewTabs: function(activeView) {
      return '<div class="action-view-tabs">' +
        '<button class="view-tab ' + (activeView === 'attr' ? 'active' : '') + '" data-view="attr">⚡ 快速行动</button>' +
        '<button class="view-tab ' + (activeView === 'timeline' ? 'active' : '') + '" data-view="timeline">⏱️ 时间轨迹</button>' +
      '</div>';
    },
    
    /**
     * 渲染属性选择页
     * @param {HTMLElement} container - 渲染容器
     */
    renderAttrSelect: function(container) {
      var html = '<div class="action-container">' +
        this.renderViewTabs('attr') +
        '<div class="action-attrs">';
      
      ATTRS.forEach(function(attr) {
        html += '<div class="action-attr-card" data-attr="' + attr.key + '" style="--attr-color: ' + attr.color + '; border-color: ' + attr.color + '; background: linear-gradient(135deg, ' + attr.color + '15, ' + attr.color + '05);">' +
          '<div class="action-attr-icon" style="color: ' + attr.color + '">' + attr.icon + '</div>' +
          '<div class="action-attr-name" style="color: ' + attr.color + '">' + attr.name + '</div>' +
          '<div class="action-attr-desc">' + attr.desc + '</div>' +
        '</div>';
      });
      
      html += '</div></div>';
      container.innerHTML = html;
      this.attachAttrEvents();
    },
    
    /**
     * 渲染行动列表
     * @param {HTMLElement} container - 渲染容器
     */
    renderActionList: function(container) {
      var self = this;
      var attr = ATTRS.find(function(a) { return a.key === self.currentAttr; });
      var actions = this.getActions(self.currentAttr);
      
      var html = '<div class="action-container">' +
        this.renderViewTabs('attr') +
        '<div class="action-list-header">' +
          '<button class="action-back-btn" id="action-back-attr">← 选择属性</button>' +
          '<h3 style="color: ' + attr.color + '">' + attr.icon + ' ' + attr.name + '</h3>' +
        '</div>' +
        '<div class="action-list-hint">💡 双击卡片可编辑或删除</div>' +
        '<div class="action-list">';
      
      actions.forEach(function(action, index) {
        html += '<div class="action-item" data-index="' + index + '" data-action="' + action.id + '">' +
          '<div class="action-item-left">' +
            '<span class="action-icon">' + action.icon + '</span>' +
            '<span class="action-name">' + action.name + '</span>' +
          '</div>' +
          '<div class="action-item-btns">' +
            '<div class="action-edit-btns hidden">' +
              '<button class="action-btn-edit" data-index="' + index + '" title="编辑">✏️</button>' +
              '<button class="action-btn-delete" data-index="' + index + '" title="删除">🗑️</button>' +
            '</div>' +
            '<button class="action-btn" data-action="' + action.id + '">开始</button>' +
          '</div>' +
        '</div>';
      });
      
      html += '</div>' +
        '<button class="action-add-btn" id="action-add-btn" style="margin: 16px; width: calc(100% - 32px); padding: 14px; background: ' + attr.color + '; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">+ 添加新行动</button>' +
      '</div>';
      container.innerHTML = html;
      this.attachActionListEvents();
    },
    
    /**
     * 渲染时间轨迹视图
     * @param {HTMLElement} container - 渲染容器
     */
    renderTimelineView: function(container) {
      var self = this;
      var data = this.getTimelineData();
      var now = new Date();
      var currentHour = now.getHours();
      var isToday = this.tlCurrentDate === this.getTodayStr();
      
      var hasPendingRecord = this.pendingTimerRecord && isToday;
      var pendingInfo = hasPendingRecord ? this.getPendingSlotsInfo() : null;
      
      var html = '<div class="action-container timeline-view">' +
        this.renderViewTabs('timeline') +
        '<div class="tl-content">';
      
      if (hasPendingRecord) {
        var record = this.pendingTimerRecord;
        var startTimeStr = this.formatTimeFromDate(record.startTime);
        var endTimeStr = this.formatTimeFromDate(record.endTime);
        html += '<div class="tl-pending-notice">' +
          '<div class="tl-pending-title">⏱️ 待确认计时记录</div>' +
          '<div class="tl-pending-info">' + record.action.name + ' | ' + record.duration + '分钟 | ' + startTimeStr + '-' + endTimeStr + '</div>' +
          '<div class="tl-pending-hint">点击蓝色高亮区域的任意格子确认记录</div>' +
        '</div>';
      }
      
      html += '<div class="tl-attr-selector">';
      ATTRS.forEach(function(attr) {
        var isSelected = self.tlSelectedAttr === attr.key ? 'selected' : '';
        html += '<div class="tl-attr-btn ' + isSelected + '" data-attr="' + attr.key + '" style="--attr-color: ' + attr.color + '">' +
          '<span class="tl-attr-icon">' + attr.icon + '</span>' +
          '<span class="tl-attr-name">' + attr.name + '</span>' +
        '</div>';
      });
      html += '<div class="tl-attr-btn tl-attr-clear" data-attr="">🚫 清除</div></div>';
      
      html += '<div class="tl-date-nav">' +
        '<button class="tl-nav-btn" id="tl-prev">←</button>' +
        '<span class="tl-date">' + this.tlCurrentDate + (isToday ? ' (今天)' : '') + '</span>' +
        '<button class="tl-nav-btn" id="tl-next">→</button>' +
        '<button class="tl-nav-btn tl-today" id="tl-today">今天</button>' +
      '</div>';
      
      html += '<div class="tl-grid-container">';
      
      var nightExpandedClass = this.tlNightExpanded ? 'expanded' : '';
      if (hasPendingRecord && pendingInfo.endHour < 6) {
        nightExpandedClass = 'expanded';
        this.tlNightExpanded = true;
      }
      html += '<div class="tl-night-section ' + nightExpandedClass + '">' +
        '<div class="tl-night-header" id="tl-night-toggle">' +
          '<span class="tl-night-icon">' + (this.tlNightExpanded ? '▼' : '▶') + '</span>' +
          '<span class="tl-night-title">夜间时段 00:00-06:00</span>' +
          '<span class="tl-night-hint">' + (this.tlNightExpanded ? '点击折叠' : '点击展开') + '</span>' +
        '</div>' +
        '<div class="tl-night-content"><div class="tl-grid tl-night-grid">';
      
      for (var h = 0; h < 6; h++) {
        var hourStr = String(h).padStart(2, '0') + ':00';
        var isCurrentHour = isToday && h === currentHour ? 'current-hour' : '';
        html += '<div class="tl-time-label ' + isCurrentHour + '">' + hourStr + '</div>';
        for (var q = 0; q < 4; q++) {
          var key = h + '-' + q;
          var slot = data.slots[key];
          var attrClass = slot ? 'attr-' + slot.attr : '';
          var attrData = slot ? ATTRS.find(function(a) { return a.key === slot.attr; }) : null;
          var isCurrent = isToday && (h === currentHour && q === Math.floor(now.getMinutes() / 15)) ? 'current' : '';
          var isPending = hasPendingRecord && this.isPendingSlot(h, q, pendingInfo);
          var pendingClass = isPending ? 'pending-confirm' : '';
          var titleText = isPending ? '点击确认：' + this.pendingTimerRecord.action.name : (attrData ? attrData.name : '点击填充');
          html += '<div class="tl-slot ' + attrClass + ' ' + isCurrent + ' ' + pendingClass + '" data-hour="' + h + '" data-quarter="' + q + '" title="' + titleText + '">' +
            (attrData ? '<span style="color: ' + attrData.color + '">' + attrData.icon + '</span>' : '') +
            (isPending && !attrData ? '<span class="pending-icon">⏱️</span>' : '') +
          '</div>';
        }
      }
      
      html += '</div></div></div>';
      
      html += '<div class="tl-day-grid"><div class="tl-grid">';
      
      for (var h = 6; h < 24; h++) {
        var hourStr = String(h).padStart(2, '0') + ':00';
        var isCurrentHour = isToday && h === currentHour ? 'current-hour' : '';
        html += '<div class="tl-time-label ' + isCurrentHour + '">' + hourStr + '</div>';
        for (var q = 0; q < 4; q++) {
          var key = h + '-' + q;
          var slot = data.slots[key];
          var attrClass = slot ? 'attr-' + slot.attr : '';
          var attrData = slot ? ATTRS.find(function(a) { return a.key === slot.attr; }) : null;
          var isCurrent = isToday && (h === currentHour && q === Math.floor(now.getMinutes() / 15)) ? 'current' : '';
          var isPending = hasPendingRecord && this.isPendingSlot(h, q, pendingInfo);
          var pendingClass = isPending ? 'pending-confirm' : '';
          var titleText = isPending ? '点击确认：' + this.pendingTimerRecord.action.name : (attrData ? attrData.name : '点击填充');
          html += '<div class="tl-slot ' + attrClass + ' ' + isCurrent + ' ' + pendingClass + '" data-hour="' + h + '" data-quarter="' + q + '" title="' + titleText + '">' +
            (attrData ? '<span style="color: ' + attrData.color + '">' + attrData.icon + '</span>' : '') +
            (isPending && !attrData ? '<span class="pending-icon">⏱️</span>' : '') +
          '</div>';
        }
      }
      
      html += '</div></div></div>';
      
      var stats = this.calculateTimelineStats(data);
      html += '<div class="tl-stats">' +
        '<div class="tl-stats-title">📊 今日统计</div>' +
        '<div class="tl-stats-grid">';
      ATTRS.forEach(function(attr) {
        var count = stats[attr.key] || 0;
        if (count > 0) {
          html += '<div class="tl-stat-item" style="--attr-color: ' + attr.color + '">' +
            '<span class="tl-stat-icon">' + attr.icon + '</span>' +
            '<span class="tl-stat-name">' + attr.name + '</span>' +
            '<span class="tl-stat-value">' + (count * 0.25) + 'h</span>' +
          '</div>';
        }
      });
      html += '</div></div>';
      
      html += '</div></div>';
      container.innerHTML = html;
      this.attachTimelineEvents();
    },
    
    /**
     * 获取今天日期字符串
     * @returns {string} 日期字符串
     */
    getTodayStr: function() {
      if (LifeGame.core.Utils && LifeGame.core.Utils.getTodayStr) {
        return LifeGame.core.Utils.getTodayStr();
      }
      // 降级处理
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 获取时间轨迹数据
     * @returns {Object} 时间轨迹数据
     */
    getTimelineData: function() {
      var storage = LifeGame.core.Storage.data;
      var timelineData = storage.timelineData || {};
      return timelineData[this.tlCurrentDate] || { slots: {} };
    },
    
    /**
     * 保存时间槽
     * @param {number} hour - 小时
     * @param {number} quarter - 刻（0-3）
     * @param {string} attr - 属性键
     */
    saveTimelineSlot: function(hour, quarter, attr) {
      var storage = LifeGame.core.Storage.data;
      var timelineData = storage.timelineData || {};
      
      if (!timelineData[this.tlCurrentDate]) {
        timelineData[this.tlCurrentDate] = { slots: {} };
      }
      
      var key = hour + '-' + quarter;
      if (attr) {
        timelineData[this.tlCurrentDate].slots[key] = { 
          attr: attr, 
          time: new Date().toISOString(),
          note: ''
        };
        var attrInfo = ATTRS.find(function(a) { return a.key === attr; });
        LifeGame.emit('timeline:recorded', { 
          attr: attrInfo, 
          hour: hour, 
          quarter: quarter,
          date: this.tlCurrentDate 
        });
      } else {
        delete timelineData[this.tlCurrentDate].slots[key];
      }
      
      LifeGame.core.Storage.set('timelineData', timelineData);
    },
    
    /**
     * 计算时间轨迹统计
     * @param {Object} data - 时间轨迹数据
     * @returns {Object} 统计数据
     */
    calculateTimelineStats: function(data) {
      var stats = {};
      ATTRS.forEach(function(attr) {
        stats[attr.key] = 0;
      });
      
      for (var key in data.slots) {
        var slot = data.slots[key];
        if (slot && slot.attr) {
          stats[slot.attr] = (stats[slot.attr] || 0) + 1;
        }
      }
      
      return stats;
    },
    
    /**
     * 绑定属性选择事件
     */
    attachAttrEvents: function() {
      var self = this;
      var container = self._lastContainer;
      if (!container) return;
      
      if (container.dataset.attrEventsBound === 'true') return;
      container.dataset.attrEventsBound = 'true';
      
      container.addEventListener('click', function(e) {
        var viewTab = e.target.closest('.view-tab');
        if (viewTab) {
          var view = viewTab.dataset.view;
          self.currentView = view;
          if (view === 'timeline') {
            self.currentAttr = null;
          }
          self.render(self._lastContainer);
          return;
        }
        
        var attrCard = e.target.closest('.action-attr-card');
        if (attrCard) {
          self.currentAttr = attrCard.dataset.attr;
          self.render(self._lastContainer);
          return;
        }
      });
    },
    
    /**
     * 绑定行动列表事件
     */
    attachActionListEvents: function() {
      var self = this;
      var container = self._lastContainer;
      if (!container) return;
      
      if (container.dataset.actionListEventsBound === 'true') return;
      container.dataset.actionListEventsBound = 'true';
      
      container.addEventListener('click', function(e) {
        var viewTab = e.target.closest('.view-tab');
        if (viewTab) {
          var view = viewTab.dataset.view;
          self.currentView = view;
          if (view === 'timeline') {
            self.currentAttr = null;
          }
          self.render(self._lastContainer);
          return;
        }
        
        if (e.target.closest('#action-back-attr')) {
          self.currentAttr = null;
          self.render(self._lastContainer);
          return;
        }
        
        if (e.target.closest('#action-add-btn')) {
          self.showActionEditDialog(null);
          return;
        }
        
        var editBtn = e.target.closest('.action-btn-edit');
        if (editBtn) {
          e.stopPropagation();
          var index = parseInt(editBtn.dataset.index);
          self.showActionEditDialog(index);
          return;
        }
        
        var deleteBtn = e.target.closest('.action-btn-delete');
        if (deleteBtn) {
          e.stopPropagation();
          var index = parseInt(deleteBtn.dataset.index);
          self.deleteAction(index);
          return;
        }
        
        var actionBtn = e.target.closest('.action-btn');
        if (actionBtn) {
          e.stopPropagation();
          var actionId = actionBtn.dataset.action;
          self.showActionOptions(actionId);
          return;
        }
      });
      
      // 桌面端双击/移动端长按显示编辑按钮
      var toggleEditBtns = function(actionItem) {
        if (!actionItem) return;
        var editBtns = actionItem.querySelector('.action-edit-btns');
        if (editBtns) {
          var isHidden = editBtns.classList.contains('hidden');
          container.querySelectorAll('.action-edit-btns').forEach(function(btns) {
            btns.classList.add('hidden');
          });
          if (isHidden) {
            editBtns.classList.remove('hidden');
          }
        }
      };
      
      // 桌面端：双击
      container.addEventListener('dblclick', function(e) {
        if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
          return; // 移动端不处理双击
        }
        var actionItem = e.target.closest('.action-item');
        if (!actionItem) return;
        if (e.target.closest('.action-btn') || 
            e.target.closest('.action-btn-edit') || 
            e.target.closest('.action-btn-delete')) {
          return;
        }
        toggleEditBtns(actionItem);
      });
      
      // 移动端：长按
      if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
        setTimeout(function() {
          container.querySelectorAll('.action-item').forEach(function(item) {
            MobileUtils.addLongPressListener(item, function(e) {
              if (e.target.closest('.action-btn') || 
                  e.target.closest('.action-btn-edit') || 
                  e.target.closest('.action-btn-delete')) {
                return;
              }
              toggleEditBtns(item);
            }, 500);
          });
        }, 100);
      }
      
      if (!this._hideEditBtnsHandler) {
        this._hideEditBtnsHandler = function(e) {
          if (!e.target.closest('.action-item')) {
            document.querySelectorAll('.action-edit-btns').forEach(function(btns) {
              btns.classList.add('hidden');
            });
          }
        };
        document.addEventListener('click', this._hideEditBtnsHandler);
      }
    },
    
    /**
     * 绑定时间轨迹事件
     */
    attachTimelineEvents: function() {
      var self = this;
      var container = self._lastContainer;
      if (!container) return;
      
      if (container.dataset.timelineEventsBound === 'true') return;
      container.dataset.timelineEventsBound = 'true';
      
      container.addEventListener('click', function(e) {
        var viewTab = e.target.closest('.view-tab');
        if (viewTab) {
          var view = viewTab.dataset.view;
          self.currentView = view;
          if (view === 'attr') {
            self.currentAttr = null;
          }
          self.render(self._lastContainer);
          return;
        }
        
        var attrBtn = e.target.closest('.tl-attr-btn');
        if (attrBtn) {
          var attr = attrBtn.dataset.attr;
          self.tlSelectedAttr = attr || null;
          self.render(self._lastContainer);
          return;
        }
      });
      
      var timelineContainer = document.querySelector('.tl-grid-container') || container;
      if (timelineContainer) {
        timelineContainer.addEventListener('click', function(e) {
          var slot = e.target.closest('.tl-slot');
          if (!slot) return;
          
          var hour = parseInt(slot.dataset.hour);
          var quarter = parseInt(slot.dataset.quarter);
          
          if (self.pendingTimerRecord && self.tlCurrentDate === self.getTodayStr()) {
            if (self.confirmTimerRecord(hour, quarter)) {
              self.render(self._lastContainer);
              return;
            }
          }
          
          self.saveTimelineSlot(hour, quarter, self.tlSelectedAttr);
          self.render(self._lastContainer);
        });
      }
      
      var nightToggle = document.getElementById('tl-night-toggle');
      if (nightToggle) {
        nightToggle.addEventListener('click', function() {
          self.tlNightExpanded = !self.tlNightExpanded;
          self.render(self._lastContainer);
        });
      }
      
      var prevBtn = document.getElementById('tl-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          self.changeDate(-1);
        });
      }
      
      var nextBtn = document.getElementById('tl-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          self.changeDate(1);
        });
      }
      
      var todayBtn = document.getElementById('tl-today');
      if (todayBtn) {
        todayBtn.addEventListener('click', function() {
          self.tlCurrentDate = self.getTodayStr();
          self.render(self._lastContainer);
        });
      }
    },
    
    /**
     * 切换日期
     * @param {number} offset - 日期偏移
     */
    changeDate: function(offset) {
      var d = new Date(this.tlCurrentDate);
      d.setDate(d.getDate() + offset);
      this.tlCurrentDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      this.render(this._lastContainer);
    },
    
    /**
     * 显示行动选项弹窗
     * @param {string} actionId - 行动ID
     */
    showActionOptions: function(actionId) {
      var self = this;
      var attr = ATTRS.find(function(a) { return a.key === self.currentAttr; });
      var actions = this.getActions(self.currentAttr);
      var action = actions.find(function(a) { return a.id === actionId; });
      if (!action) {
        console.error('[action] 行动未找到:', actionId);
        return;
      }
      
      var overlay = document.createElement('div');
      overlay.className = 'action-modal-overlay';
      overlay.id = 'action-options-modal';
      
      var html = 
        '<div class="action-modal-content">' +
          '<div class="action-modal-header" style="background: linear-gradient(135deg, ' + attr.color + '20, ' + attr.color + '10);">' +
            '<span class="action-modal-icon">' + action.icon + '</span>' +
            '<div class="action-modal-title">' + action.name + '</div>' +
            '<div class="action-modal-subtitle">' + attr.icon + ' ' + attr.name + '</div>' +
          '</div>' +
          '<div class="action-modal-options">' +
            '<div class="action-option" data-mode="timer">' +
              '<div class="option-icon" style="background: ' + attr.color + '20;">⏱️</div>' +
              '<div class="option-info">' +
                '<div class="option-name">正计时</div>' +
                '<div class="option-desc">记录行动时长</div>' +
              '</div>' +
            '</div>' +
            '<div class="action-option" data-mode="countdown">' +
              '<div class="option-icon" style="background: ' + attr.color + '20;">⏲️</div>' +
              '<div class="option-info">' +
                '<div class="option-name">倒计时</div>' +
                '<div class="option-desc">设定目标时间</div>' +
              '</div>' +
            '</div>' +
            '<div class="action-option" data-mode="quick">' +
              '<div class="option-icon" style="background: ' + attr.color + '20;">⚡</div>' +
              '<div class="option-info">' +
                '<div class="option-name">快速添加</div>' +
                '<div class="option-desc">直接记录到时间轨迹</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button class="action-modal-close">取消</button>' +
        '</div>';
      
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      
      var cleanupOverlay = function() {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      };
      
      var escHandler = function(e) {
        if (e.key === 'Escape') {
          cleanupOverlay();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
      
      var closeOverlay = function() {
        cleanupOverlay();
        document.removeEventListener('keydown', escHandler);
      };
      
      overlay.querySelectorAll('.action-option').forEach(function(option) {
        option.addEventListener('click', function() {
          var mode = this.dataset.mode;
          document.removeEventListener('keydown', escHandler);
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          self.handleActionMode(action, attr, mode);
        });
      });
      
      overlay.querySelector('.action-modal-close').addEventListener('click', function() {
        closeOverlay();
      });
      
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closeOverlay();
        }
      });
    },
    
    /**
     * 处理行动模式
     * @param {Object} action - 行动对象
     * @param {Object} attr - 属性对象
     * @param {string} mode - 模式
     */
    handleActionMode: function(action, attr, mode) {
      var self = this;
      
      if (mode === 'quick') {
        this.showQuickAddDialog(action, attr);
      } else if (mode === 'timer') {
        this.showTimer(action, attr, 'up');
      } else if (mode === 'countdown') {
        this.showTimer(action, attr, 'down');
      }
    },
    
    /**
     * 显示计时器
     * @param {Object} action - 行动对象
     * @param {Object} attr - 属性对象
     * @param {string} mode - 模式
     */
    showTimer: function(action, attr, mode) {
      var self = this;
      var startTime = Date.now();
      var pausedTime = 0;
      var totalPaused = 0;
      var isPaused = false;
      var duration = mode === 'down' ? 25 * 60 * 1000 : 0;
      
      if (self.timerInterval) {
        clearInterval(self.timerInterval);
        self.timerInterval = null;
      }
      
      var overlay = document.createElement('div');
      overlay.className = 'timer-modal-overlay';
      overlay.id = 'action-timer-modal';
      
      var html = 
        '<div class="timer-modal-content">' +
          '<div class="timer-header">' +
            '<span class="timer-icon">' + action.icon + '</span>' +
            '<div class="timer-title">' + action.name + '</div>' +
            '<div class="timer-subtitle">' + (mode === 'up' ? '正计时' : '倒计时') + '</div>' +
            '<div class="timer-status" id="timer-status" style="font-size: 12px; color: var(--text2); margin-top: 4px;">进行中</div>' +
          '</div>' +
          '<div class="timer-display">' +
            '<span id="timer-count">' + (mode === 'down' ? '25:00' : '00:00') + '</span>' +
          '</div>' +
          '<div class="timer-controls" style="display: flex; gap: 12px; justify-content: center;">' +
            '<button class="timer-btn pause" id="timer-pause" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">⏸️ 暂停</button>' +
            '<button class="timer-btn stop" id="timer-stop" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 14px 28px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">✓ 结束</button>' +
          '</div>' +
        '</div>';
      
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      
      function updateDisplay() {
        var now = Date.now();
        var elapsed = now - startTime - totalPaused;
        var display;
        
        if (mode === 'down') {
          var remaining = Math.max(0, duration - elapsed);
          var mins = Math.floor(remaining / 60000);
          var secs = Math.floor((remaining % 60000) / 1000);
          display = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        } else {
          var mins = Math.floor(elapsed / 60000);
          var secs = Math.floor((elapsed % 60000) / 1000);
          display = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        }
        
        var countEl = overlay.querySelector('#timer-count');
        if (countEl) {
          countEl.textContent = display;
        }
      }
      
      function startTimer() {
        self.timerInterval = setInterval(updateDisplay, 1000);
      }
      
      function stopTimer() {
        if (self.timerInterval) {
          clearInterval(self.timerInterval);
          self.timerInterval = null;
        }
      }
      
      function cleanupTimer() {
        stopTimer();
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }
      
      startTimer();
      
      overlay.querySelector('#timer-pause').addEventListener('click', function() {
        if (isPaused) {
          totalPaused += Date.now() - pausedTime;
          isPaused = false;
          this.innerHTML = '⏸️ 暂停';
          this.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
          overlay.querySelector('#timer-status').textContent = '进行中';
          startTimer();
        } else {
          pausedTime = Date.now();
          isPaused = true;
          this.innerHTML = '▶️ 继续';
          this.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
          overlay.querySelector('#timer-status').textContent = '已暂停';
          stopTimer();
        }
      });
      
      overlay.querySelector('#timer-stop').addEventListener('click', function() {
        stopTimer();
        
        if (isPaused) {
          totalPaused += Date.now() - pausedTime;
        }
        
        var elapsed = Date.now() - startTime - totalPaused;
        var totalSeconds = Math.floor(elapsed / 1000);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        
        if (minutes < 1) {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          alert('计时结束：' + action.name + '\n时长：' + seconds + '秒\n\n⚠️ 不足1分钟，不予记录');
          return;
        }
        
        var endTime = new Date();
        var startTimeObj = new Date(endTime.getTime() - elapsed);
        self.pendingTimerRecord = {
          action: action,
          attr: attr,
          startTime: startTimeObj,
          endTime: endTime,
          duration: minutes,
          durationSeconds: totalSeconds
        };
        
        LifeGame.emit('action:completed', {
          action: action,
          attr: attr,
          duration: minutes,
          time: endTime.toISOString()
        });
        
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        
        self.currentView = 'timeline';
        self.tlSelectedAttr = attr.key;
        
        var container = document.getElementById('world-content');
        if (container) {
          self.render(container);
          setTimeout(function() {
            alert('计时完成：' + action.name + ' 🎉\n时长：' + minutes + '分钟' + (seconds > 0 ? seconds + '秒' : '') + '\n\n请点击时间轨迹中对应的格子来标记时间段');
          }, 100);
        }
      });
    },
    
    /**
     * 确认计时记录
     * @param {number} hour - 小时
     * @param {number} quarter - 刻
     * @returns {boolean} 是否成功
     */
    confirmTimerRecord: function(hour, quarter) {
      if (!this.pendingTimerRecord) return false;
      
      var record = this.pendingTimerRecord;
      var attrKey = record.attr.key;
      
      var slotsNeeded = Math.ceil(record.duration / 15);
      if (slotsNeeded < 1) slotsNeeded = 1;
      
      for (var i = 0; i < slotsNeeded; i++) {
        var targetQuarter = quarter - i;
        var targetHour = hour;
        if (targetQuarter < 0) {
          targetQuarter += 4;
          targetHour--;
        }
        if (targetHour < 0) break;
        
        this.saveTimelineSlot(targetHour, targetQuarter, attrKey);
      }
      
      this.pendingTimerRecord = null;
      return true;
    },
    
    /**
     * 获取待确认槽位信息
     * @returns {Object|null} 槽位信息
     */
    getPendingSlotsInfo: function() {
      if (!this.pendingTimerRecord) return null;
      
      var record = this.pendingTimerRecord;
      var endHour = record.endTime.getHours();
      var endMin = record.endTime.getMinutes();
      var endQuarter = Math.floor(endMin / 15);
      
      var slotsNeeded = Math.ceil(record.duration / 15);
      if (slotsNeeded < 1) slotsNeeded = 1;
      
      return {
        endHour: endHour,
        endQuarter: endQuarter,
        slotsNeeded: slotsNeeded
      };
    },
    
    /**
     * 检查是否为待确认槽位
     * @param {number} hour - 小时
     * @param {number} quarter - 刻
     * @param {Object} info - 槽位信息
     * @returns {boolean} 是否待确认
     */
    isPendingSlot: function(hour, quarter, info) {
      if (!info) return false;
      
      var slotIndex = hour * 4 + quarter;
      var endIndex = info.endHour * 4 + info.endQuarter;
      var diff = endIndex - slotIndex;
      
      return diff >= 0 && diff < info.slotsNeeded;
    },
    
    /**
     * 格式化时间
     * @param {Date} date - 日期对象
     * @returns {string} 时间字符串
     */
    formatTimeFromDate: function(date) {
      var h = date.getHours();
      var m = date.getMinutes();
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    },
    
    /**
     * 显示快速添加弹窗
     * @param {Object} action - 行动对象
     * @param {Object} attr - 属性对象
     */
    showQuickAddDialog: function(action, attr) {
      var self = this;
      
      var overlay = document.createElement('div');
      overlay.className = 'action-modal-overlay';
      overlay.id = 'quick-add-modal';
      
      var timeOptions = '';
      for (var h = 0; h < 24; h++) {
        for (var q = 0; q < 4; q++) {
          var timeStr = String(h).padStart(2, '0') + ':' + String(q * 15).padStart(2, '0');
          timeOptions += '<option value="' + h + '-' + q + '">' + timeStr + '</option>';
        }
      }
      
      var now = new Date();
      var currentHour = now.getHours();
      var currentMin = now.getMinutes();
      var roundedQuarter = Math.round(currentMin / 15);
      if (roundedQuarter >= 4) {
        roundedQuarter = 0;
        currentHour++;
        if (currentHour >= 24) currentHour = 23;
      }
      var endTimeValue = currentHour + '-' + roundedQuarter;
      
      var startHour = currentHour;
      var startQuarter = roundedQuarter - 4;
      if (startQuarter < 0) {
        startQuarter += 4;
        startHour--;
      }
      if (startHour < 0) startHour = 0;
      var startTimeValue = startHour + '-' + startQuarter;
      
      var html = 
        '<div class="action-modal-content" style="max-width: 400px;">' +
          '<div class="action-modal-header" style="background: linear-gradient(135deg, ' + attr.color + '20, ' + attr.color + '10);">' +
            '<span class="action-modal-icon">⚡</span>' +
            '<div class="action-modal-title">快速添加</div>' +
            '<div class="action-modal-subtitle">' + action.name + '</div>' +
          '</div>' +
          '<div class="quick-add-form" style="padding: 20px;">' +
            '<div class="time-select-row" style="display: flex; gap: 12px; margin-bottom: 16px;">' +
              '<div class="time-select-group" style="flex: 1;">' +
                '<label style="display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px;">开始时间</label>' +
                '<select id="quick-start-time" class="time-select" style="width: 100%; padding: 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 8px; color: var(--text); font-size: 14px;">' +
                  timeOptions +
                '</select>' +
              '</div>' +
              '<div class="time-select-group" style="flex: 1;">' +
                '<label style="display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px;">结束时间</label>' +
                '<select id="quick-end-time" class="time-select" style="width: 100%; padding: 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 8px; color: var(--text); font-size: 14px;">' +
                  timeOptions +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="duration-display" id="quick-duration" style="text-align: center; padding: 16px; background: var(--bg2); border-radius: 12px; margin-bottom: 12px;">' +
              '<span style="font-size: 24px; font-weight: 700; color: var(--accent);">1:00</span>' +
              '<span style="font-size: 12px; color: var(--text2); margin-left: 8px;">时长</span>' +
            '</div>' +
            '<div class="quick-duration-presets" style="display: flex; gap: 8px; margin-bottom: 16px; justify-content: center;">' +
              '<button class="duration-preset-btn" data-minutes="15" style="padding: 8px 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 20px; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s;">15分钟</button>' +
              '<button class="duration-preset-btn" data-minutes="30" style="padding: 8px 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 20px; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s;">30分钟</button>' +
              '<button class="duration-preset-btn" data-minutes="60" style="padding: 8px 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 20px; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s;">1小时</button>' +
              '<button class="duration-preset-btn" data-minutes="120" style="padding: 8px 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 20px; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s;">2小时</button>' +
            '</div>' +
            '<div class="quick-add-actions" style="display: flex; gap: 12px;">' +
              '<button class="action-modal-close" id="quick-cancel" style="flex: 1; margin: 0;">取消</button>' +
              '<button class="action-btn" id="quick-confirm" style="flex: 1; padding: 14px; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">确认添加</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      
      var startSelect = overlay.querySelector('#quick-start-time');
      var endSelect = overlay.querySelector('#quick-end-time');
      startSelect.value = startTimeValue;
      endSelect.value = endTimeValue;
      
      function updateDuration() {
        var startVal = startSelect.value.split('-');
        var endVal = endSelect.value.split('-');
        var startH = parseInt(startVal[0]);
        var startQ = parseInt(startVal[1]);
        var endH = parseInt(endVal[0]);
        var endQ = parseInt(endVal[1]);
        
        var startMinutes = startH * 60 + startQ * 15;
        var endMinutes = endH * 60 + endQ * 15;
        var duration = endMinutes - startMinutes;
        
        if (duration < 0) duration = 0;
        
        var hours = Math.floor(duration / 60);
        var mins = duration % 60;
        overlay.querySelector('#quick-duration').innerHTML = 
          '<span style="font-size: 24px; font-weight: 700; color: var(--accent);">' + 
          hours + ':' + String(mins).padStart(2, '0') + 
          '</span>' +
          '<span style="font-size: 12px; color: var(--text2); margin-left: 8px;">时长</span>';
        
        return { startH, startQ, endH, endQ, duration };
      }
      
      startSelect.addEventListener('change', updateDuration);
      endSelect.addEventListener('change', updateDuration);
      updateDuration();
      
      overlay.querySelectorAll('.duration-preset-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var minutes = parseInt(this.dataset.minutes);
          var endVal = endSelect.value.split('-');
          var endH = parseInt(endVal[0]);
          var endQ = parseInt(endVal[1]);
          
          var endMinutes = endH * 60 + endQ * 15;
          var startMinutes = endMinutes - minutes;
          
          if (startMinutes < 0) {
            startMinutes = 0;
          }
          
          var startH = Math.floor(startMinutes / 60);
          var startQ = Math.floor((startMinutes % 60) / 15);
          
          startSelect.value = startH + '-' + startQ;
          
          overlay.querySelectorAll('.duration-preset-btn').forEach(function(b) {
            b.style.background = 'var(--bg2)';
            b.style.color = 'var(--text2)';
            b.style.borderColor = 'var(--card-border)';
          });
          this.style.background = 'var(--accent)';
          this.style.color = 'var(--bg)';
          this.style.borderColor = 'var(--accent)';
          
          updateDuration();
        });
      });
      
      overlay.querySelector('#quick-cancel').addEventListener('click', function() {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      });
      
      overlay.querySelector('#quick-confirm').addEventListener('click', function() {
        var timeInfo = updateDuration();
        
        if (timeInfo.duration <= 0) {
          alert('结束时间必须晚于开始时间');
          return;
        }
        
        self.fillTimeRange(timeInfo.startH, timeInfo.startQ, timeInfo.endH, timeInfo.endQ, attr.key);
        
        LifeGame.emit('action:quick', {
          action: action,
          attr: attr,
          startTime: String(timeInfo.startH).padStart(2, '0') + ':' + String(timeInfo.startQ * 15).padStart(2, '0'),
          endTime: String(timeInfo.endH).padStart(2, '0') + ':' + String(timeInfo.endQ * 15).padStart(2, '0'),
          duration: timeInfo.duration,
          time: new Date().toISOString()
        });
        
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        alert('已记录：' + action.name + ' 📝\n时间：' + timeInfo.startH + ':' + String(timeInfo.startQ * 15).padStart(2, '0') + ' - ' + timeInfo.endH + ':' + String(timeInfo.endQ * 15).padStart(2, '0'));
      });
      
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
        }
      });
    },
    
    /**
     * 填充时间范围
     * @param {number} startH - 开始小时
     * @param {number} startQ - 开始刻
     * @param {number} endH - 结束小时
     * @param {number} endQ - 结束刻
     * @param {string} attrKey - 属性键
     */
    fillTimeRange: function(startH, startQ, endH, endQ, attrKey) {
      var current = { hour: startH, quarter: startQ };
      var end = { hour: endH, quarter: endQ };
      
      while (current.hour < end.hour || (current.hour === end.hour && current.quarter < end.quarter)) {
        this.saveTimelineSlot(current.hour, current.quarter, attrKey);
        current.quarter++;
        if (current.quarter >= 4) {
          current.quarter = 0;
          current.hour++;
        }
      }
    },
    
    /**
     * 显示编辑行动弹窗
     * @param {number} index - 行动索引
     */
    showActionEditDialog: function(index) {
      var self = this;
      var actions = this.getActions(this.currentAttr);
      var isEdit = index !== null && index !== undefined;
      var action = isEdit ? actions[index] : { id: 'a' + Date.now(), name: '', icon: '📝' };
      var attr = ATTRS.find(function(a) { return a.key === self.currentAttr; });
      
      var overlay = document.createElement('div');
      overlay.className = 'action-modal-overlay';
      overlay.id = 'action-edit-modal';
      
      var html = 
        '<div class="action-modal-content" style="max-width: 360px;">' +
          '<div class="action-modal-header" style="background: linear-gradient(135deg, ' + attr.color + '20, ' + attr.color + '10);">' +
            '<span class="action-modal-icon">' + (isEdit ? '✏️' : '➕') + '</span>' +
            '<div class="action-modal-title">' + (isEdit ? '编辑行动' : '添加新行动') + '</div>' +
            '<div class="action-modal-subtitle">' + attr.name + '</div>' +
          '</div>' +
          '<div class="action-edit-form" style="padding: 20px;">' +
            '<div class="form-group" style="margin-bottom: 16px;">' +
              '<label style="display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px;">行动名称</label>' +
              '<input type="text" id="action-name" value="' + (action.name || '') + '" placeholder="例如：交通、买菜..." style="width: 100%; padding: 12px; background: var(--bg2); border: 1px solid var(--card-border); border-radius: 8px; color: var(--text); font-size: 14px; box-sizing: border-box;">' +
            '</div>' +
            '<div class="form-group" style="margin-bottom: 20px;">' +
              '<label style="display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px;">图标</label>' +
              '<div class="icon-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">' +
                ['📝', '🧼', '🧹', '🍳', '🚿', '🏋️', '🏃', '🏌️', '🧘', '📚', '✍️', '📖', '🏀', '⚽', '🦾', '💃', '💻', '🎬', '🎨', '💼', '😴', '🌅', '🎮', '💭', '🚗', '🚌', '🚲', '🚶', '🛒', '🍽️', '🧺', '💊', '💉', '🦷', '👁️', '🧠', '❤️', '💪', '🦴', '🫁', '🧘‍♂️', '🏊', '🚴', '🧗', '🏕️', '🎸', '🎹', '🎤', '🎧', '📷', '🎨', '✂️', '📐', '🧵', '🧶', '🔨', '🪛', '🔧', '🪚', '🧰', '🌱', '🌻', '🌷', '🌳', '🌲', '🍄', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'].map(function(emoji) {
                  return '<button class="icon-option' + (emoji === action.icon ? ' selected' : '') + '" data-icon="' + emoji + '" style="width: 36px; height: 36px; font-size: 18px; background: ' + (emoji === action.icon ? attr.color + '30' : 'var(--bg2)') + '; border: 2px solid ' + (emoji === action.icon ? attr.color : 'transparent') + '; border-radius: 8px; cursor: pointer;">' + emoji + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<div class="action-edit-actions" style="display: flex; gap: 12px;">' +
              '<button class="action-modal-close" id="action-edit-cancel" style="flex: 1; margin: 0;">取消</button>' +
              '<button class="action-btn" id="action-edit-save" style="flex: 1; padding: 14px; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; background: ' + attr.color + '; color: #fff;">' + (isEdit ? '保存' : '添加') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      
      var selectedIcon = action.icon;
      
      overlay.querySelectorAll('.icon-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
          selectedIcon = this.dataset.icon;
          overlay.querySelectorAll('.icon-option').forEach(function(b) {
            b.style.background = 'var(--bg2)';
            b.style.borderColor = 'transparent';
          });
          this.style.background = attr.color + '30';
          this.style.borderColor = attr.color;
        });
      });
      
      overlay.querySelector('#action-edit-cancel').addEventListener('click', function() {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      });
      
      overlay.querySelector('#action-edit-save').addEventListener('click', function() {
        var name = overlay.querySelector('#action-name').value.trim();
        if (!name) {
          alert('请输入行动名称');
          return;
        }
        
        if (isEdit) {
          actions[index].name = name;
          actions[index].icon = selectedIcon;
        } else {
          actions.push({
            id: 'a' + Date.now(),
            name: name,
            icon: selectedIcon
          });
        }
        
        self.saveCustomActions();
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        self.render(self._lastContainer);
      });
      
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
        }
      });
    },
    
    /**
     * 删除行动
     * @param {number} index - 行动索引
     */
    deleteAction: function(index) {
      var actions = this.getActions(this.currentAttr);
      if (confirm('确定要删除 "' + actions[index].name + '" 吗？')) {
        actions.splice(index, 1);
        this.saveCustomActions();
        this.render(this._lastContainer);
      }
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, ActionModule);
})();
