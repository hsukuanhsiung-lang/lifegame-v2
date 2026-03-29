/**
 * History Module - 操作历史记录
 * 记录所有在网页的操作：增加任务、完成任务、完成挑战、时间轨迹、行动
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'history';
  
  // 历史记录类型
  var HISTORY_TYPES = {
    TASK_CREATE: { icon: '📝', label: '创建任务', color: '#38bdf8' },
    SUBTASK_CREATE: { icon: '📌', label: '添加子任务', color: '#0ea5e9' },
    TASK_COMPLETE: { icon: '✅', label: '完成任务', color: '#22c55e' },
    SUBTASK_COMPLETE: { icon: '✓', label: '完成子任务', color: '#10b981' },
    TASK_DELETE: { icon: '🗑️', label: '删除任务', color: '#ef4444' },
    TASK_UNDO: { icon: '↩️', label: '撤销完成', color: '#6b7280' },
    CHALLENGE_COMPLETE: { icon: '🔥', label: '完成挑战', color: '#f59e0b' },
    FORBID_VIOLATE: { icon: '⚠️', label: '禁止事项违规', color: '#dc2626' },
    TIMELINE_RECORD: { icon: '⏱️', label: '记录时间', color: '#8b5cf6' },
    ACTION_START: { icon: '⚡', label: '开始行动', color: '#ec4899' },
    ACTION_STOP: { icon: '⏹️', label: '结束行动', color: '#6b7280' },
    LEVEL_UP: { icon: '🆙', label: '等级提升', color: '#fbbf24' },
    EXP_GAIN: { icon: '✨', label: '获得经验', color: '#a855f7' }
  };
  
  var HistoryModule = {
    currentDate: null, // 当前查看的日期，null表示查看全部
    _lastContainer: null,
    _isProcessing: false,  // 防止竞态条件的简单锁
    _pendingQueue: [],     // 待处理的记录队列
    
    init: function() {
      LifeGame.log('[history] 初始化');
      this.currentDate = this.getTodayStr();
      this.bindEvents();
      this.initDefaultData();
    },
    
    initDefaultData: function() {
      // 如果没有历史记录，初始化空数组
      var history = LifeGame.core.Storage.get('history') || [];
      if (!Array.isArray(history)) {
        LifeGame.core.Storage.set('history', []);
      }
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:history', function(data) {
        var module = LifeGame.getModule('history');
        if (module) module.render();
      });
      
      // 监听各种操作事件并记录
      // 任务相关
      LifeGame.on('task:created', function(data) { self.addRecord('TASK_CREATE', data); });
      LifeGame.on('task:completed', function(data) { 
        // 区分主任务和子任务
        if (data.isSubtask) {
          self.addRecord('SUBTASK_COMPLETE', data);
        } else {
          self.addRecord('TASK_COMPLETE', data);
        }
      });
      LifeGame.on('task:deleted', function(data) { self.addRecord('TASK_DELETE', data); });
      LifeGame.on('subtask:created', function(data) { self.addRecord('SUBTASK_CREATE', data); });
      
      // 挑战相关
      LifeGame.on('challenge:completed', function(data) { self.addRecord('CHALLENGE_COMPLETE', data); });
      LifeGame.on('challenge:cancelled', function(data) { self.removeChallengeRecord(data.challengeId); });
      LifeGame.on('forbid:violated', function(data) { self.addRecord('FORBID_VIOLATE', data); });
      
      // 时间轨迹相关
      LifeGame.on('timeline:recorded', function(data) { self.addRecord('TIMELINE_RECORD', data); });
      
      // 行动相关
      LifeGame.on('action:started', function(data) { self.addRecord('ACTION_START', data); });
      LifeGame.on('action:stopped', function(data) { self.addRecord('ACTION_STOP', data); });
      
      // 其他
      LifeGame.on('user:levelup', function(data) { self.addRecord('LEVEL_UP', data); });
      LifeGame.on('user:exp:gained', function(data) { self.addRecord('EXP_GAIN', data); });
      LifeGame.on('exp:earned', function(data) { 
        // 过滤掉每日挑战和子任务的经验记录（因为已经在 CHALLENGE_COMPLETE/SUBTASK_COMPLETE 中记录了）
        if (data.source === 'dailyChallenge' || data.source === 'subtask') return;
        self.addRecord('EXP_GAIN', { exp: data.amount, source: data.source }); 
      });
    },
    
    // 处理记录队列（防止竞态条件）
    _processQueue: function() {
      if (this._isProcessing || this._pendingQueue.length === 0) return;
      
      this._isProcessing = true;
      
      while (this._pendingQueue.length > 0) {
        var item = this._pendingQueue.shift();
        this._doAddRecord(item.type, item.data);
      }
      
      this._isProcessing = false;
    },
    
    // 实际添加记录（内部方法）
    _doAddRecord: function(type, data) {
      var history = LifeGame.core.Storage.get('history') || [];
      
      var record = {
        id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        date: this.getTodayStr()
      };
      
      // 新记录插入到开头
      history.unshift(record);
      
      // 最多保留 500 条记录
      if (history.length > 500) {
        history = history.slice(0, 500);
      }
      
      LifeGame.core.Storage.set('history', history);
      LifeGame.log('[history] 记录:', type, data);
    },
    
    // 添加历史记录（入口）
    addRecord: function(type, data) {
      // 加入队列并处理
      this._pendingQueue.push({ type: type, data: data });
      this._processQueue();
    },
    
    getTodayStr: function() {
      if (LifeGame.core.Utils && LifeGame.core.Utils.getTodayStr) {
        return LifeGame.core.Utils.getTodayStr();
      }
      // 降级处理
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('world-content') || document.getElementById('app');
      }
      if (!container) return;
      
      this._lastContainer = container;
      var self = this;
      var history = LifeGame.core.Storage.get('history') || [];
      
      // 按日期筛选
      var filteredHistory = this.currentDate ? 
        history.filter(function(r) { return r.date === self.currentDate || r.timestamp.split('T')[0] === self.currentDate; }) :
        history;
      
      var grouped = this.groupByDate(filteredHistory);
      
      // 生成日期选项（今天、昨天、前天等）
      var dateOptions = this.generateDateOptions();
      
      var html = '<div class="history-container">' +
        // 日期选择器
        '<div class="history-date-nav">' +
          '<button class="history-nav-btn" id="history-prev">←</button>' +
          '<div class="history-current-date">' + (this.currentDate ? this.formatDateFull(this.currentDate) : '全部记录') + '</div>' +
          '<button class="history-nav-btn" id="history-next">→</button>' +
        '</div>' +
        '<div class="history-date-options">' +
          dateOptions.map(function(opt) {
            var isActive = self.currentDate === opt.value;
            var activeClass = isActive ? 'active' : '';
            return '<button class="history-date-option ' + activeClass + '" data-date="' + (opt.value || '') + '">' + opt.label + '</button>';
          }).join('') +
        '</div>' +
        '<div class="history-list-header">' +
          '<span class="history-count">共 ' + filteredHistory.length + ' 条记录</span>' +
          (this.currentDate ? '<button class="history-view-all" id="history-view-all">查看全部</button>' : '') +
        '</div>' +
        '<div class="history-list">';
      
      if (filteredHistory.length === 0) {
        html += '<div class="history-empty">' +
          '<div class="history-empty-icon">📭</div>' +
          '<div class="history-empty-text">暂无历史记录</div>' +
          '<div class="history-empty-hint">该日期没有记录</div>' +
        '</div>';
      } else {
        for (var date in grouped) {
          html += '<div class="history-date-group">' +
            '<div class="history-date-header">' + this.formatTimeHeader(date) + '</div>' +
            '<div class="history-items">';
          
          grouped[date].forEach(function(record) {
            var typeInfo = HISTORY_TYPES[record.type] || { icon: '📝', label: '操作', color: '#888' };
            var time = new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            var desc = self.getDescription(record);
            
            // 取消完成按钮 - 只对未撤销的完成任务显示
            var undoBtn = '';
            if (record.type === 'TASK_COMPLETE' && !record.undone) {
              undoBtn = '<button class="history-undo-btn" data-record-id="' + record.id + '">↩ 取消完成</button>';
            }
            
            html += '<div class="history-item ' + (record.undone ? 'undone' : '') + '">' +
              '<div class="history-item-icon" style="background: ' + typeInfo.color + '20; color: ' + typeInfo.color + '">' + typeInfo.icon + '</div>' +
              '<div class="history-item-content">' +
                '<div class="history-item-title">' + typeInfo.label + (record.undone ? ' (已撤销)' : '') + '</div>' +
                '<div class="history-item-desc">' + desc + '</div>' +
                undoBtn +
              '</div>' +
              '<div class="history-item-time">' + time + '</div>' +
            '</div>';
          });
          
          html += '</div></div>';
        }
      }
      
      // 添加清空按钮
      if (history.length > 0) {
        html += '<button class="history-clear-btn" id="history-clear">🗑️ 清空历史记录</button>';
      }
      
      html += '</div></div>';
      container.innerHTML = html;
      
      // 绑定返回按钮事件
      var backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          LifeGame.emit('nav:back');
        });
      }
      
      // 绑定日期导航按钮
      var prevBtn = document.getElementById('history-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          self.changeDate(-1);
        });
      }
      
      var nextBtn = document.getElementById('history-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          self.changeDate(1);
        });
      }
      
      // 绑定日期选项按钮
      document.querySelectorAll('.history-date-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var date = this.dataset.date;
          self.currentDate = date || null;
          self.render(container);
        });
      });
      
      // 绑定查看全部按钮
      var viewAllBtn = document.getElementById('history-view-all');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
          self.currentDate = null;
          self.render(container);
        });
      }
      
      // 绑定清空按钮事件
      var clearBtn = document.getElementById('history-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            LifeGame.core.Storage.set('history', []);
            self.render();
          }
        });
      }
      
      // 绑定取消完成按钮事件
      document.querySelectorAll('.history-undo-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var recordId = this.dataset.recordId;
          self.undoTaskComplete(recordId);
        });
      });
    },
    
    // 生成日期选项 - 仅保留快捷选项，其他日期需手动切换
    generateDateOptions: function() {
      var today = new Date();
      var options = [{ value: null, label: '全部' }];
      
      // 只添加今天、昨天、前天三个快捷选项
      for (var i = 0; i < 3; i++) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var label;
        
        if (i === 0) label = '今天';
        else if (i === 1) label = '昨天';
        else if (i === 2) label = '前天';
        
        options.push({ value: dateStr, label: label });
      }
      
      return options;
    },
    
    // 切换日期
    changeDate: function(offset) {
      if (!this.currentDate) {
        // 如果当前是全部，切换到今天
        this.currentDate = this.getTodayStr();
        this.render(this._lastContainer);
        return;
      }
      
      var d = new Date(this.currentDate);
      d.setDate(d.getDate() + offset);
      this.currentDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      this.render(this._lastContainer);
    },
    
    // 完整格式化日期
    formatDateFull: function(dateStr) {
      var today = this.getTodayStr();
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      
      var d = new Date(dateStr);
      var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      var weekDay = weekDays[d.getDay()];
      
      if (dateStr === today) return '今天 (' + weekDay + ')';
      if (dateStr === yesterdayStr) return '昨天 (' + weekDay + ')';
      return dateStr + ' (' + weekDay + ')';
    },
    
    // 时间头部格式化
    formatTimeHeader: function(dateStr) {
      return this.formatDateFull(dateStr);
    },
    
    groupByDate: function(history) {
      var grouped = {};
      history.forEach(function(record) {
        var date = record.date || record.timestamp.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(record);
      });
      return grouped;
    },
    
    formatDate: function(dateStr) {
      var today = this.getTodayStr();
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      
      if (dateStr === today) return '今天';
      if (dateStr === yesterdayStr) return '昨天';
      return dateStr;
    },
    
    getDescription: function(record) {
      var data = record.data || {};
      switch (record.type) {
        case 'TASK_CREATE':
          return '创建了任务「' + (data.task ? data.task.n : '未知') + '」';
        case 'SUBTASK_CREATE':
          return '添加了子任务「' + (data.subtask ? data.subtask.n : '未知') + '」到「' + (data.task ? data.task.n : '未知') + '」';
        case 'TASK_COMPLETE':
          var exp = data.expChange || data.exp || 0;
          var expText = exp > 0 ? ' +' + exp + '经验' : '';
          return '完成了任务「' + (data.task ? data.task.n : data.name || '未知') + '」' + expText;
        case 'SUBTASK_COMPLETE':
          var subtaskName = data.name || data.subtaskName || '未知';
          var parentName = data.parentName || data.taskName || '';
          var exp = data.expChange || data.exp || 0;
          var expText = exp > 0 ? ' +' + exp + '经验' : '';
          if (parentName) {
            return '完成了子任务「' + subtaskName + '」 (来自: ' + parentName + ')' + expText;
          }
          return '完成了子任务「' + subtaskName + '」' + expText;
        case 'TASK_DELETE':
          return '删除了任务「' + (data.task ? data.task.n : '未知') + '」';
        case 'TASK_UNDO':
          return '撤销完成任务「' + (data.taskName || '未知') + '」，扣除 ' + (data.expDeducted || 0) + ' 经验';
        case 'CHALLENGE_COMPLETE':
          var exp = data.exp || 0;
          return '完成了每日挑战「' + (data.challenge ? data.challenge.name : data.name || '未知') + '」获得 ' + exp + ' 经验';
        case 'FORBID_VIOLATE':
          return '禁止事项「' + (data.forbid ? data.forbid.name : data.name || '未知') + '」违规';
        case 'TIMELINE_RECORD':
          return '记录了「' + (data.attr ? data.attr.name : '未知') + '」时间段';
        case 'ACTION_START':
          return '开始了「' + (data.action ? data.action.name : '未知') + '」';
        case 'ACTION_STOP':
          return '结束了「' + (data.action ? data.action.name : '未知') + '」，用时' + (data.duration || '未知');
        case 'LEVEL_UP':
          return '等级提升到 Lv.' + (data.level || '?');
        case 'EXP_GAIN':
          var exp = data.exp || data.amount || 0;
          var source = data.source ? ' (' + data.source + ')' : '';
          return '获得 ' + exp + ' 经验值' + source;
        default:
          return '进行了操作';
      }
    },
    
    // 取消完成任务
    undoTaskComplete: function(recordId) {
      var history = LifeGame.core.Storage.get('history') || [];
      var record = history.find(function(h) { return h.id === recordId; });
      
      if (!record) {
        alert('未找到该记录');
        return;
      }
      
      if (record.undone) {
        alert('该记录已经撤销过了');
        return;
      }
      
      var taskName = record.data && record.data.task ? record.data.task.n : '未知任务';
      if (!confirm('确定要取消完成任务「' + taskName + '」吗？\n\n这将：\n• 将任务标记为未完成\n• 扣除之前获得的经验值\n• 扣除契合度提升\n• 在历史中标记为已撤销')) {
        return;
      }
      
      // 1. 标记历史记录为已撤销
      record.undone = true;
      record.undoneAt = new Date().toISOString();
      
      // 2. 找到并更新任务状态
      var tasks = LifeGame.core.Storage.get('tasks') || [];
      var taskId = record.data && record.data.task ? record.data.task.id : null;
      var task = tasks.find(function(t) { return t.id === taskId; });
      
      if (task) {
        task.done = false;
        task.completedAt = null;
        
        // 如果是子任务，还需要更新父任务的子任务状态
        if (record.data.isSubtask && record.data.parentId) {
          var parentTask = tasks.find(function(t) { return t.id === record.data.parentId; });
          if (parentTask && parentTask.subtasks) {
            var subtask = parentTask.subtasks.find(function(s) { return s.id === taskId; });
            if (subtask) {
              subtask.done = false;
            }
          }
        }
        
        LifeGame.core.Storage.set('tasks', tasks);
      }
      
      // 3. 扣除经验值
      var expChange = record.data.expChange || 0;
      if (expChange > 0) {
        var profile = LifeGame.core.Storage.get('profile') || {};
        profile.exp = Math.max(0, (profile.exp || 0) - expChange);
        LifeGame.core.Storage.set('profile', profile);
        
        // 如果是子任务，还要扣除父任务的经验
        if (record.data.parentId) {
          var parentTask = tasks.find(function(t) { return t.id === record.data.parentId; });
          if (parentTask) {
            parentTask.totalExp = Math.max(0, (parentTask.totalExp || 0) - expChange);
            LifeGame.core.Storage.set('tasks', tasks);
          }
        }
      }
      
      // 4. 扣除契合度
      if (LifeGame.core.AffinityManager) {
        // 扣除完成任务获得的契合度
        LifeGame.core.AffinityManager.changeAffinity(
          -2, // 假设完成任务获得+2契合度
          '取消完成任务',
          taskName
        );
      }
      
      // 5. 添加撤销记录
      this.addRecord('TASK_UNDO', {
        originalRecord: recordId,
        task: record.data.task,
        expDeducted: expChange,
        taskName: taskName
      });
      
      // 6. 保存历史记录
      LifeGame.core.Storage.set('history', history);
      
      // 7. 触发事件通知其他模块
      LifeGame.emit('task:undone', {
        taskId: taskId,
        taskName: taskName,
        expDeducted: expChange
      });
      
      // 8. 刷新显示
      this.render();
      
      alert('已取消完成任务「' + taskName + '」\n扣除经验值: ' + expChange);
    },
    
    // 删除挑战完成的历史记录（取消打卡时调用）
    removeChallengeRecord: function(challengeId) {
      if (!challengeId) return;
      
      var history = LifeGame.core.Storage.get('history') || [];
      var today = this.getTodayStr();
      
      // 找到今天该挑战的完成记录并删除
      var initialLength = history.length;
      history = history.filter(function(record) {
        if (record.type === 'CHALLENGE_COMPLETE' && 
            record.date === today &&
            record.data && 
            record.data.challengeId === challengeId) {
          LifeGame.log('[history] 删除挑战完成记录:', record.data.name || challengeId);
          return false; // 过滤掉这条记录
        }
        return true;
      });
      
      // 如果有记录被删除，保存并刷新
      if (history.length < initialLength) {
        LifeGame.core.Storage.set('history', history);
        LifeGame.log('[history] 已删除挑战完成记录:', challengeId);
        // 刷新显示
        this.render();
      }
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, HistoryModule);
})();
