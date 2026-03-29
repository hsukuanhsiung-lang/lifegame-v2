(function() {
  'use strict';
  
  var MODULE_NAME = 'tasks';
  
  /**
   * HTML 转义函数，防止 XSS 攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  var escapeHtml = function(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  var TasksModule = {
    data: [],
    currentFilter: 'today',
    currentType: 'all',
    currentDateOffset: 0,
    showDateSwitcher: false,
    showCompleted: false,
    
    /**
     * 初始化模块
     */
    init: function() {
      LifeGame.log('[tasks] 初始化');
      this.cleanup();
      this.loadData();
      this.initDefaultData();
      this.bindEvents();
    },
    
    /**
     * 清理资源（防止内存泄漏）
     */
    cleanup: function() {
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
        this.renderTimeout = null;
      }
      
      if (this.tooltipHideTimer) {
        clearTimeout(this.tooltipHideTimer);
        this.tooltipHideTimer = null;
      }
      
      this.hideTaskTooltip();
      
      var container = document.getElementById('world-content');
      if (container) {
        container.dataset.tasksEventsBound = '';
        
        if (this._eventHandlers) {
          if (this._eventHandlers.click) {
            container.removeEventListener('click', this._eventHandlers.click);
          }
          if (this._eventHandlers.mousedown) {
            container.removeEventListener('mousedown', this._eventHandlers.mousedown);
          }
          if (this._eventHandlers.mouseover) {
            container.removeEventListener('mouseover', this._eventHandlers.mouseover);
          }
          this._eventHandlers = {};
        }
      }
    },
    
    /**
     * 从 storage 加载任务数据
     */
    loadData: function() {
      var storage = LifeGame.core.Storage.data;
      var tasks = storage.tasks || [];
      this.data = Array.isArray(tasks) ? tasks : [];
    },
    
    /**
     * 初始化默认任务数据（Day 1）
     */
    initDefaultData: function() {
      if (this.data.length > 0) {
        return;
      }
      
      var today = this.getTodayStr();
      var tomorrow = this.getDateStr(1);
      
      var longTasks = [
        {
          id: 't_long_1',
          n: '硅基的尽头',
          type: 'main',
          diff: 'B',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_1_1', n: '数字飞升规划', diff: 'B', done: false, date: tomorrow },
            { id: 's_1_2', n: '健身维护硬件', diff: 'C', done: false, date: tomorrow },
            { id: 's_1_3', n: '作息优化算力', diff: 'C', done: false, date: tomorrow }
          ]
        },
        {
          id: 't_long_2',
          n: '人生游戏开发',
          type: 'main',
          diff: 'A',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_2_1', n: '完成LifeGame v2.0核心功能', diff: 'A', done: false, date: tomorrow },
            { id: 's_2_2', n: '录Day 1视频素材', diff: 'C', done: false, date: today },
            { id: 's_2_3', n: '剪辑并发布Day 1视频', diff: 'B', done: false, date: tomorrow }
          ]
        },
        {
          id: 't_long_3',
          n: '赚钱',
          type: 'main',
          diff: 'A',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_3_1', n: '收入稳定化规划', diff: 'A', done: false, date: tomorrow },
            { id: 's_3_2', n: '每日记账分析', diff: 'F', done: false, daily: true },
            { id: 's_3_3', n: '寻找变现机会', diff: 'B', done: false, date: tomorrow }
          ]
        },
        {
          id: 't_long_4',
          n: '自媒体',
          type: 'side',
          diff: 'B',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_4_1', n: '视频创作：Day 1 vlog', diff: 'B', done: false, date: today },
            { id: 's_4_2', n: '个人品牌建设', diff: 'C', done: false, date: tomorrow },
            { id: 's_4_3', n: '研究抖音AI视频效果', diff: 'C', done: false, date: tomorrow }
          ]
        },
        {
          id: 't_long_5',
          n: 'AI时代',
          type: 'main',
          diff: 'S',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_5_1', n: '让Echo获得身体', diff: 'S', done: false, date: tomorrow },
            { id: 's_5_2', n: '每日AI学习/实践1小时', diff: 'F', done: false, daily: true },
            { id: 's_5_3', n: '探索AI应用场景', diff: 'A', done: false, date: tomorrow }
          ]
        },
        {
          id: 't_long_6',
          n: '精神力',
          type: 'side',
          diff: 'C',
          period: 'long',
          done: false,
          totalExp: 0,
          subtasks: [
            { id: 's_6_1', n: '冥想练习', diff: 'F', done: false, daily: true },
            { id: 's_6_2', n: '读书0.5小时', diff: 'F', done: false, daily: true },
            { id: 's_6_3', n: '写作输出', diff: 'D', done: false, date: tomorrow },
            { id: 's_6_4', n: '心态修炼', diff: 'C', done: false, date: tomorrow }
          ]
        }
      ];
      
      var todayTasks = [
        {
          id: 't_today_1',
          n: '完成所有挑战（首次验证）',
          type: 'main',
          diff: 'C',
          period: 'today',
          done: false,
          sub: '10项每日挑战全部完成'
        },
        {
          id: 't_today_2',
          n: '人生游戏开发',
          type: 'main',
          diff: 'C',
          period: 'today',
          done: false,
          sub: '录Day 1视频素材'
        },
        {
          id: 't_today_3',
          n: '收衣服',
          type: 'side',
          diff: 'F',
          period: 'today',
          done: false,
          sub: '简单家务'
        },
        {
          id: 't_today_4',
          n: '整理食材和冰箱',
          type: 'side',
          diff: 'F',
          period: 'today',
          done: false,
          sub: '简单家务'
        },
        {
          id: 't_today_5',
          n: '爬楼梯回家（31楼）',
          type: 'side',
          diff: 'E',
          period: 'today',
          done: false,
          sub: '有氧运动'
        },
        {
          id: 't_today_6',
          n: '解决素材债（单日）',
          type: 'side',
          diff: 'E',
          period: 'today',
          done: false,
          sub: '剪过往视频'
        },
        {
          id: 't_today_7',
          n: '列出后天任务',
          type: 'side',
          diff: 'F',
          period: 'today',
          done: false,
          sub: '规划3月23-24日'
        }
      ];
      
      var inboxTasks = [
        {
          id: 't_inbox_1',
          n: '研究抖音AI视频效果',
          type: 'side',
          diff: 'C',
          period: 'inbox',
          done: false,
          sub: '效果达到期望值，想应用到LifeGame vlog'
        }
      ];
      
      this.data = longTasks.concat(todayTasks).concat(inboxTasks);
      LifeGame.core.Storage.set('tasks', this.data);
    },
    
    /**
     * 绑定事件监听
     */
    bindEvents: function() {
      var self = this;
      
      this.renderTimeout = null;
      this.pendingRender = false;
      
      LifeGame.on('view:tasks', function(data) {
        var validFilters = ['today', 'long', 'inbox'];
        var filter = data && data.filter;
        if (validFilters.indexOf(filter) === -1) {
          filter = 'today';
        }
        self.currentFilter = filter;
        self.currentType = data.type || 'all';
      });
      
      LifeGame.on('storage:changed', function() {
        self.loadData();
        if (window.currentSubView === 'tasks') {
          self.debouncedRender();
        }
      });
      
      LifeGame.on('task:expAdded', function(data) {
        self.loadData();
        if (self.currentFilter === 'long' || self.currentFilter === 'longterm') {
          self.debouncedRender();
        }
      });
    },
    
    /**
     * 获取日期字符串 YYYY-MM-DD
     * @param {number} offset - 日期偏移（0=今天, 1=明天, 2=后天）
     * @returns {string} 日期字符串
     */
    getDateStr: function(offset) {
      offset = offset || 0;
      if (LifeGame.core.Utils && LifeGame.core.Utils.getDateStr) {
        return LifeGame.core.Utils.getDateStr(offset);
      }
      // 降级处理
      var d = new Date();
      d.setDate(d.getDate() + offset);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 获取今天日期字符串
     * @returns {string} 今天日期字符串
     */
    getTodayStr: function() {
      if (LifeGame.core.Utils && LifeGame.core.Utils.getTodayStr) {
        return LifeGame.core.Utils.getTodayStr();
      }
      // 降级处理
      return this.getDateStr(0);
    },
    
    /**
     * 计算任务过期天数
     * @param {Object} task - 任务对象
     * @returns {number} 过期天数
     */
    calculateOverdueDays: function(task) {
      if (task.done) return 0;
      
      var today = this.getTodayStr();
      var taskDate = null;
      
      if (task.period === 'today') {
        return 0;
      }
      
      if (task.period === 'subtask' || task.isSubtask) {
        taskDate = task.date;
      }
      
      if (!taskDate) return 0;
      
      var todayMs = new Date(today).getTime();
      var taskMs = new Date(taskDate).getTime();
      var diffMs = todayMs - taskMs;
      var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    },
    
    /**
     * 判断日期是否在目标日期之前
     * @param {string} date1 - 日期1
     * @param {string} date2 - 日期2
     * @returns {boolean} date1是否在date2之前
     */
    isDateBefore: function(date1, date2) {
      return new Date(date1).getTime() < new Date(date2).getTime();
    },
    
    /**
     * 获取指定日期的任务
     * @param {string} dateStr - 日期字符串
     * @returns {Array} 任务列表
     */
    getTasksForDate: function(dateStr) {
      var self = this;
      var result = [];
      var todayStr = this.getTodayStr();
      var isToday = (dateStr === todayStr);
      var addedIds = new Set();
      
      if (isToday) {
        this.data.forEach(function(t) {
          if (t.period === 'today' && !t.delayed) {
            if (self.currentType !== 'all' && t.type !== self.currentType) return;
            result.push(t);
          }
        });
      }
      
      var collectDatedSubtasks = function(task, subtasks, parentNames) {
        if (!subtasks) return;
        
        subtasks.forEach(function(s) {
          if (s.daily) return;
          
          var path = parentNames ? parentNames + ' > ' + s.n : s.n;
          
          var shouldCollect = false;
          var isOverdue = false;
          
          if (s.date === dateStr) {
            shouldCollect = true;
          } else if (isToday && s.date && !s.done && self.isDateBefore(s.date, todayStr)) {
            shouldCollect = true;
            isOverdue = true;
          }
          
          if (shouldCollect && !addedIds.has(s.id)) {
            addedIds.add(s.id);
            if (self.currentType !== 'all' && task.type !== self.currentType) return;
            result.push({
              id: s.id,
              n: s.n,
              type: task.type,
              diff: s.diff || task.diff || 'F',
              sub: '',
              done: s.done,
              period: 'subtask',
              isSubtask: true,
              parentId: task.id,
              parentTask: task,
              subtaskPath: path,
              date: s.date,
              isOverdue: isOverdue
            });
          }
          
          if (s.subtasks && s.subtasks.length > 0) {
            collectDatedSubtasks(task, s.subtasks, path);
          }
        });
      };
      
      this.data.forEach(function(t) {
        if (t.period === 'long' || t.period === 'longterm') {
          collectDatedSubtasks(t, t.subtasks, '');
        }
      });
      
      result.forEach(function(t) {
        t._overdueDays = self.calculateOverdueDays(t);
      });
      
      // 检查是否有自定义排序（直接从 localStorage 读取）
      var hasCustomOrder = false;
      try {
        var savedStr = localStorage.getItem('task_order_today');
        if (savedStr) {
          var savedOrder = JSON.parse(savedStr);
          hasCustomOrder = savedOrder && savedOrder.length > 0;
        }
      } catch(e) {}
      
      // 只有在没有自定义排序时才自动排序（过期任务置顶）
      if (!hasCustomOrder) {
        result.sort(function(a, b) {
          if (a.done !== b.done) {
            return a.done ? 1 : -1;
          }
          if (!a.done && !b.done) {
            return b._overdueDays - a._overdueDays;
          }
          return 0;
        });
      }
      
      if (isToday && !this.showCompleted) {
        result = result.filter(function(t) { return !t.done; });
      }
      
      return result;
    },
    
    /**
     * 获取过滤后的任务列表
     * @returns {Array} 过滤后的任务列表
     */
    getFilteredTasks: function() {
      var self = this;
      
      if (this.currentFilter === 'today') {
        var targetDate = this.getDateStr(this.currentDateOffset);
        return this.getTasksForDate(targetDate);
      } else if (this.currentFilter === 'long') {
        var tasks = this.data.filter(function(t) {
          return t.period === 'long' || t.period === 'longterm';
        });
        
        if (this.currentType !== 'all') {
          tasks = tasks.filter(function(t) {
            return t.type === self.currentType;
          });
        }
        
        return tasks;
      } else if (this.currentFilter === 'inbox') {
        return this.data.filter(function(t) {
          return t.period === 'inbox';
        });
      }
      
      return [];
    },
    
    /**
     * 获取今日未完成任务数量（用于标签小红点）
     * @returns {number} 未完成任务数量
     */
    getTodayRemainingCount: function() {
      this.loadData();
      
      var count = 0;
      
      if (this.data.length === 0) {
        this.initDefaultData();
        this.loadData();
      }
      
      this.data.forEach(function(task) {
        if (task.period === 'today' && task.done !== true) {
          count++;
        }
      });
      
      return count;
    },
    
    /**
     * 获取渲染容器
     * @returns {HTMLElement|null} 渲染容器元素
     */
    getRenderContainer: function() {
      var worldContent = document.getElementById('world-content');
      if (worldContent) {
        return worldContent;
      }
      return null;
    },
    
    /**
     * 防抖渲染
     */
    debouncedRender: function() {
      var self = this;
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
      }
      this.renderTimeout = setTimeout(function() {
        var container = self.getRenderContainer();
        if (container) self.render(container);
      }, 50);
    },
    
    /**
     * 渲染任务列表
     * @param {HTMLElement} container - 渲染容器
     */
    render: function(container) {
      this.hideTaskTooltip();
      
      if (!container) {
        LifeGame.error('[tasks] 错误：没有传入容器');
        return;
      }
      if (container.id === 'app') {
        LifeGame.error('[tasks] 错误：尝试渲染到 #app，已取消');
        return;
      }
      
      var validFilters = ['today', 'long', 'inbox'];
      if (validFilters.indexOf(this.currentFilter) === -1) {
        this.currentFilter = 'today';
      }
      
      this.loadData();
      
      var tasks = this.getFilteredTasks();
      tasks = this.applyTaskOrder(tasks, this.currentFilter);
      
      var html = this.renderHeader() + this.renderTaskList(tasks);
      container.innerHTML = html;
      this.attachEvents();
      this.initDragSort();
    },
    
    /**
     * 渲染头部区域
     * @returns {string} HTML字符串
     */
    renderHeader: function() {
      var self = this;
      
      var remainingCount = this.getTodayRemainingCount();
      var badgeHtml = remainingCount > 0 ? '<span class="tab-badge">' + remainingCount + '</span>' : '';
      
      var mainTabs = '<div class="main-tabs">' +
        '<button class="main-tab ' + (this.currentFilter === 'today' ? 'active' : '') + '" data-filter="today" id="today-tab"><span class="tab-text">今日</span>' + badgeHtml + (this.currentFilter === 'today' ? '<span class="tab-hint">（双击切换日期）</span>' : '') + '</button>' +
        '<button class="main-tab ' + (this.currentFilter === 'long' ? 'active' : '') + '" data-filter="long">长期</button>' +
        '<button class="main-tab ' + (this.currentFilter === 'inbox' ? 'active' : '') + '" data-filter="inbox">收集箱</button>' +
      '</div>';
      
      var dateSwitcher = '';
      if (this.currentFilter === 'today' && this.showDateSwitcher) {
        var dates = ['今天', '明天', '后天'];
        dateSwitcher = '<div class="date-switcher">' +
          dates.map(function(d, i) {
            return '<button class="date-btn ' + (self.currentDateOffset === i ? 'active' : '') + '" data-offset="' + i + '">' + d + '</button>';
          }).join('') +
          '<button class="close-switcher" id="close-switcher">✕</button>' +
        '</div>';
      }
      
      var typeTabs = '';
      if (this.currentFilter === 'today' || this.currentFilter === 'long') {
        typeTabs = '<div class="type-tabs">' +
          '<button class="type-btn ' + (this.currentType === 'all' ? 'active' : '') + '" data-type="all">全部</button>' +
          '<button class="type-btn ' + (this.currentType === 'main' ? 'active' : '') + '" data-type="main">主线</button>' +
          '<button class="type-btn ' + (this.currentType === 'side' ? 'active' : '') + '" data-type="side">支线</button>' +
          '<button class="type-btn type-btn-add" id="add-task-btn">+ 添加</button>' +
        '</div>';
      } else if (this.currentFilter === 'inbox') {
        typeTabs = '<div class="type-tabs">' +
          '<button class="type-btn type-btn-add" id="add-task-btn">+ 添加备忘</button>' +
        '</div>';
      }
      
      var showCompletedBtn = '';
      if (this.currentFilter === 'today' && this.currentDateOffset === 0) {
        showCompletedBtn = '<button class="show-completed-btn ' + (this.showCompleted ? 'active' : '') + '" id="show-completed-btn">' +
          (this.showCompleted ? '✓ 显示已完成' : '○ 隐藏已完成') +
        '</button>';
      }
      
      return '<div class="tasks-header">' +
        mainTabs +
        dateSwitcher +
        typeTabs +
        showCompletedBtn +
      '</div>';
    },
    
    /**
     * 渲染任务列表
     * @param {Array} tasks - 任务数组
     * @returns {string} HTML字符串
     */
    renderTaskList: function(tasks) {
      if (tasks.length === 0) {
        return '<div class="tasks-empty">暂无任务<br>点击上方按钮添加</div>';
      }
      
      var html = '<div class="task-grid" data-draggable-container="true">';
      var self = this;
      tasks.forEach(function(t) {
        html += self.renderTaskCard(t);
      });
      html += '</div>';
      return html;
    },
    
    /**
     * 渲染任务卡片
     * @param {Object} t - 任务对象
     * @returns {string} HTML字符串
     */
    renderTaskCard: function(t) {
      var self = this;
      
      // 确保任务有 ID（如果数据中没有，生成一个临时的）
      var taskId = t.id || ('gen_' + Math.random().toString(36).substr(2, 9));
      if (!t.id) {
        t.id = taskId;
      }
      
      var isLong = t.period === 'long' || t.period === 'longterm';
      var isInbox = t.period === 'inbox';
      var isSubtask = t.isSubtask || t.period === 'subtask';
      
      var overdueDays = this.calculateOverdueDays(t);
      var overdueClass = '';
      if (!t.done && overdueDays >= 1) {
        overdueClass = ' overdue';
      }
      
      var tag = '';
      if (t.type === 'main') tag = '<span class="task-tag main">主线</span>';
      else if (t.type === 'side') tag = '<span class="task-tag side">支线</span>';
      if (isInbox) tag = '<span class="task-tag inbox">收集箱</span>';
      if (isSubtask) tag = '<span class="task-tag subtask">子任务</span>';
      
      var diffClass = 'diff-' + (t.diff || 'F');
      var doneClass = t.done ? ' done' : '';
      
      var isLongCompleteable = false;
      if (isLong && !t.done) {
        var currentExp = this.calculateTaskExp(t);
        var targetExpVal = this.expTargets[t.diff] || 1;
        isLongCompleteable = currentExp >= targetExpVal;
      }
      
      var expProgressHtml = '';
      var expInfoHtml = '';
      var cardColorClass = '';
      if (isLong) {
        var totalExp = this.calculateTaskExp(t);
        var targetExp = this.expTargets[t.diff] || 1;
        var expPercent = Math.min(100, (totalExp / targetExp) * 100);
        
        expInfoHtml = '<span class="exp-info-inline">' + totalExp + '/' + targetExp + '</span>';
        
        var percentDisplay = expPercent < 1 ? expPercent.toFixed(1) : Math.round(expPercent);
        expProgressHtml = '<div class="exp-progress-wrap">' +
          '<div class="exp-bar-wrap">' +
            '<div class="exp-bar-bg">' +
              '<div class="exp-bar-fill" style="width:' + Math.min(100, expPercent) + '%"></div>' +
            '</div>' +
            '<span class="exp-percent-end">' + percentDisplay + '%</span>' +
          '</div>' +
        '</div>';
        
        cardColorClass = this.getTaskLevelColorClass(t.diff);
        
        // 子任务展开功能已移除，使用思维导图管理子任务
      }
      
      var inboxActions = '';
      if (isInbox) {
        inboxActions = '<div class="inbox-actions">' +
          '<button class="inbox-btn" data-action="today" data-task="' + taskId + '">今天</button>' +
          '<button class="inbox-btn" data-action="tomorrow" data-task="' + taskId + '">明天</button>' +
          '<button class="inbox-btn" data-action="link" data-task="' + taskId + '">关联</button>' +
        '</div>';
      }
      
      var chkTitle = isLong ? (t.done ? '已完成所有子任务' : (isLongCompleteable ? '点击完成或升级任务' : '需完成所有子任务')) : '';
      var chkClass = doneClass;
      if (isLong && !t.done) {
        chkClass += isLongCompleteable ? ' long-completeable' : ' long-locked';
      }
      
      var actionBtn = '';
      if (isLong) {
        actionBtn = '<button class="task-btn add-btn" data-task="' + taskId + '" title="添加子任务">+</button>';
      } else if (!isInbox && !isSubtask) {
        actionBtn = '<button class="task-btn edit-btn" data-task="' + taskId + '" title="编辑">✏️</button>';
      }
      
      var cardDataAttrs = isSubtask ? 
        'data-subtask-id="' + taskId + '" data-parent-id="' + t.parentId + '"' : 
        'data-task-id="' + taskId + '"';
      var chkDataAttrs = isSubtask ? 
        'data-subtask-id="' + taskId + '" data-parent-id="' + t.parentId + '"' : 
        'data-task-id="' + taskId + '"';
      var chkContent = t.done ? '✓' : (isLongCompleteable ? '🎉' : (isLong ? '🔒' : ''));
      
      var cardClass = doneClass + ' ' + this.getTaskLevelColorClass(t.diff) + overdueClass;
      
      var overdueBadge = '';
      if (overdueDays > 0 && !t.done) {
        // 左上角过期角标，根据天数显示不同颜色
        var badgeClass = overdueDays === 1 ? 'overdue-warning' : 'overdue-danger';
        overdueBadge = '<span class="overdue-badge-corner ' + badgeClass + '">过期' + overdueDays + '天</span>';
      }
      
      return this.renderUnifiedCard(t, {
        isLong: isLong,
        isInbox: isInbox,
        isSubtask: isSubtask,
        overdueDays: overdueDays,
        overdueBadge: overdueBadge,
        cardDataAttrs: cardDataAttrs,
        chkClass: chkClass,
        chkDataAttrs: chkDataAttrs,
        chkContent: chkContent
      });
    },
    
    /**
     * 统一卡片渲染函数
     * @param {Object} t - 任务对象
     * @param {Object} options - 渲染选项
     * @returns {string} HTML字符串
     */
    renderUnifiedCard: function(t, options) {
      var self = this;
      var isLong = options.isLong;
      var isInbox = options.isInbox;
      var isSubtask = options.isSubtask;
      var overdueDays = options.overdueDays;
      var overdueBadge = options.overdueBadge;
      var cardDataAttrs = options.cardDataAttrs;
      
      // 确保任务有 ID
      var taskId = t.id || ('gen_' + Math.random().toString(36).substr(2, 9));
      if (!t.id) {
        t.id = taskId;
      }
      
      var grade = (t.grade || t.diff || 'F').toUpperCase();
      var gradeConfig = TaskGradeCardRenderer.getGradeConfig(grade);
      var gradeClass = 'grade-' + grade.toLowerCase();
      
      var gradeColors = {
        'F': '#6b6b6b', 'E': '#8b7355', 'D': '#3b82f6', 'C': '#22c55e',
        'B': '#a855f7', 'A': '#f59e0b', 'S': '#ef4444', 'SS': '#a855f7', 'SSS': '#ef4444'
      };
      var iconBgColor = gradeColors[grade] || '#6b6b6b';
      
      var icons = {'F': '🌱', 'E': '🥉', 'D': '💠', 'C': '🌿', 'B': '💎', 'A': '👑', 'S': '🔥', 'SS': '⚡', 'SSS': '🌟'};
      var icon = icons[grade] || '📋';
      
      var overdueClass = overdueDays > 0 && !t.done ? ' overdue' : '';
      
      var typeClassName = '';
      var typeText = '';
      if (t.type === 'main') {
        typeClassName = 'main';
        typeText = '主线';
      } else if (t.type === 'side') {
        typeClassName = 'side';
        typeText = '支线';
      }
      
      var periodTag = '';
      if (isInbox) periodTag = '<span class="long-card-period-tag inbox">收集箱</span>';
      else if (isSubtask) periodTag = '<span class="long-card-period-tag subtask">子任务</span>';
      else if (!isLong) periodTag = '<span class="long-card-period-tag today">今日</span>';
      
      var sssPulseRings = grade === 'SSS' ? 
        '<div class="sss-pulse-ring"></div><div class="sss-pulse-ring"></div><div class="sss-pulse-ring"></div>' : '';
      
      var descText = '';
      var fromInfo = '';
      if (isLong) {
        if (t.subtasks && t.subtasks.length > 0) {
          var visibleSubtasks = t.subtasks.filter(function(s) { return !s.daily; });
          var visibleCompleted = visibleSubtasks.filter(function(s) { return s.done; }).length;
          descText = '子任务: ' + visibleCompleted + '/' + visibleSubtasks.length;
        } else {
          descText = t.sub || '持续努力目标';
        }
      } else {
        if (isSubtask && t.parentTask) {
          fromInfo = t.parentTask.n;
          descText = t.sub || '';
        } else {
          descText = t.sub || (isInbox ? '待分类任务' : '日常任务');
        }
      }
      
      var footerHtml = '';
      if (isLong) {
        var totalExp = this.calculateTaskExp(t);
        var targetExp = this.expTargets[t.diff] || 1;
        var expPercent = Math.min(100, (totalExp / targetExp) * 100);
        var isCompleteable = totalExp >= targetExp && !t.done;
        
        // 计算百分比显示（小于1%显示小数，否则显示整数）
        var percentDisplay = expPercent < 1 ? expPercent.toFixed(1) : Math.round(expPercent);
        
        footerHtml = 
          '<div class="long-card-progress-wrap">' +
            '<div class="long-card-progress-info">' +
              '<span class="long-card-exp-current">' + totalExp + '</span>' +
              '<span class="long-card-exp-separator">/</span>' +
              '<span class="long-card-exp-target">' + targetExp + '</span>' +
              '<span class="long-card-exp-percent">(' + percentDisplay + '%)</span>' +
            '</div>' +
            '<div class="long-card-progress">' +
              '<div class="long-card-progress-fill" style="width:' + expPercent + '%"></div>' +
            '</div>' +
          '</div>' +
          '<div class="long-card-footer">' +
            '<span class="long-card-title">' + gradeConfig.title + '</span>' +
          '</div>';
        
        if (isCompleteable) {
          footerHtml += '<button class="long-card-complete-btn" data-task="' + t.id + '">🎉 完成/升级</button>';
        }
      } else if (isInbox) {
        footerHtml = 
          '<div class="long-card-footer inbox-footer">' +
            '<span class="long-card-exp">+' + gradeConfig.exp + ' EXP</span>' +
            '<span class="long-card-title">' + gradeConfig.title + '</span>' +
          '</div>' +
          '<div class="inbox-actions-row">' +
            '<button class="inbox-btn-card" data-action="today" data-task="' + t.id + '">今天</button>' +
            '<button class="inbox-btn-card" data-action="tomorrow" data-task="' + t.id + '">明天</button>' +
            '<button class="inbox-btn-card" data-action="link" data-task="' + t.id + '">关联</button>' +
          '</div>';
      } else {
        // 今日任务：添加勾选框
        // 正方形完成框移到头部，footer只显示称号
        footerHtml = 
          '<div class="long-card-footer">' +
            '<span class="long-card-title">' + gradeConfig.title + '</span>' +
          '</div>';
      }
      
      var typeClass = isLong ? 'long-type' : (isInbox ? 'inbox-type' : 'today-type');
      
      // 头部左侧：今日/收集箱显示正方形完成框，长期任务显示等级图标
      var headerLeft = '';
      if (isLong) {
        headerLeft = '<div class="long-card-icon" style="background: ' + iconBgColor + ';">' + icon + '</div>';
      } else {
        // 正方形完成框
        var chkClass = t.done ? ' checked' : '';
        headerLeft = '<div class="task-chk-square' + chkClass + '" ' + options.chkDataAttrs + '></div>';
      }
      
      return '<div class="long-task-card ' + typeClass + ' ' + gradeClass + overdueClass + '" ' + cardDataAttrs + ' data-overdue="' + overdueDays + '">' +
        sssPulseRings +
        '<div class="long-card-header-row compact">' +
          headerLeft +
          '<div class="long-card-title-wrap">' +
            '<div class="long-card-name-row">' +
              '<span class="long-card-name-compact">' + escapeHtml(t.n) + '</span>' +
              (fromInfo ? '<span class="long-card-from">来自: ' + escapeHtml(fromInfo) + '</span>' : '') +
            '</div>' +
            (periodTag ? '<div class="long-card-tags">' + periodTag + '</div>' : '') +
          '</div>' +
          '<div class="long-card-right-badges">' +
            (typeClassName ? '<div class="long-card-type-badge ' + typeClassName + '">' + typeText + '</div>' : '') +
            '<div class="grade-exp-wrap">' +
              '<div class="long-card-grade" style="background: ' + iconBgColor + ';">' + grade + '</div>' +
              '<div class="long-card-exp-badge">+' + gradeConfig.exp + ' EXP</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        overdueBadge +
        (descText ? '<div class="long-card-desc compact">' + descText + '</div>' : '') +
        footerHtml +
      '</div>';
    },
    
    /**
     * 获取任务等级颜色类
     * @param {string} diff - 难度等级
     * @returns {string} CSS类名
     */
    getTaskLevelColorClass: function(diff) {
      var colorMap = {
        'F': 'task-level-f',
        'E': 'task-level-e',
        'D': 'task-level-d',
        'C': 'task-level-c',
        'B': 'task-level-b',
        'A': 'task-level-a',
        'S': 'task-level-s',
        'SS': 'task-level-ss',
        'SSS': 'task-level-sss'
      };
      return colorMap[diff] || 'task-level-f';
    },
    
    /**
     * 格式化日期标签
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期标签
     */
    formatDateLabel: function(dateStr) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      
      var diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '今天';
      if (diffDays === 1) return '明天';
      if (diffDays === 2) return '后天';
      
      var month = targetDate.getMonth() + 1;
      var day = targetDate.getDate();
      return month + '/' + day;
    },
    
    /**
     * 计算任务总经验
     * @param {Object} t - 任务对象
     * @returns {number} 总经验值
     */
    calculateTaskExp: function(t) {
      if (!t.subtasks) return t.totalExp || 0;
      var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
      var total = 0;
      t.subtasks.forEach(function(s) {
        if (s.done && (!s.daily || s.isDailyExp)) {
          if (s.isDailyExp) {
            total += s.exp || 0;
          } else {
            total += expMap[s.diff] || expMap[t.diff] || 1;
          }
        }
      });
      return total;
    },
    
    /**
     * 获取每日挑战列表（供 challenges 模块调用）
     * @param {Array} excludeNames - 要排除的名称列表
     * @returns {Array} 每日挑战列表
     */
    getDailyChallenges: function(excludeNames) {
      var challenges = [];
      var forbidNames = excludeNames || [];
      var self = this;
      
      this.data.forEach(function(t) {
        if (t.period === 'long' || t.period === 'longterm') {
          if (t.subtasks) {
            t.subtasks.forEach(function(s) {
              if (s.daily && forbidNames.indexOf(s.n) === -1) {
                challenges.push({
                  taskId: t.id,
                  subtask: s,
                  taskName: t.n,
                  taskDiff: t.diff
                });
              }
            });
          }
        }
      });
      
      return challenges;
    },
    
    /**
     * 切换子任务完成状态
     * @param {string} taskId - 父任务ID
     * @param {string} subId - 子任务ID
     * @param {boolean} done - 完成状态
     * @returns {Object|null} 更新后的子任务
     */
    toggleSubtaskDone: function(taskId, subId, done) {
      var task = this.data.find(function(t) { return t.id === taskId; });
      if (!task || !task.subtasks) return null;
      
      var sub = task.subtasks.find(function(s) { return s.id === subId; });
      if (!sub) return null;
      
      sub.done = done !== undefined ? done : !sub.done;
      
      // 记录完成时间
      if (sub.done) {
        sub.completedAt = new Date().toISOString();
      } else {
        delete sub.completedAt;
      }
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      LifeGame.emit('task:updated', { taskId: taskId, subId: subId, done: sub.done });
      LifeGame.emit('subtask:toggled', { taskId: taskId, subId: subId, done: sub.done, subtask: sub });
      
      return sub;
    },
    
    /**
     * 添加子任务
     * @param {string} parentId - 父任务ID
     * @param {Object} subtaskData - 子任务数据
     * @returns {Object|null} 添加的子任务
     */
    addSubtask: function(parentId, subtaskData) {
      var parentTask = this.data.find(function(t) { return t.id === parentId; });
      if (!parentTask) return null;
      
      if (!parentTask.subtasks) {
        parentTask.subtasks = [];
      }
      
      var newSubtask = {
        id: 's' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        n: subtaskData.n,
        diff: subtaskData.diff || 'F',
        done: false,
        daily: subtaskData.daily || false,
        streak: 0,
        totalDays: 0
      };
      
      if (subtaskData.date) newSubtask.date = subtaskData.date;
      
      parentTask.subtasks.push(newSubtask);
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      LifeGame.emit('task:updated', { taskId: parentId, subtask: newSubtask });
      LifeGame.emit('subtask:created', { task: parentTask, subtask: newSubtask });
      
      return newSubtask;
    },
    
    /**
     * 获取长期任务列表
     * @returns {Array} 长期任务列表
     */
    getLongTasks: function() {
      return this.data.filter(function(t) {
        return t.period === 'long' || t.period === 'longterm';
      });
    },
    
    /**
     * 根据ID获取任务
     * @param {string} taskId - 任务ID
     * @returns {Object|null} 任务对象
     */
    getTaskById: function(taskId) {
      return this.data.find(function(t) { return t.id === taskId; }) || null;
    },
    
    _eventHandlers: {},
    
    /**
     * 绑定事件处理器
     */
    attachEvents: function() {
      var self = this;
      
      var container = document.getElementById('world-content');
      if (!container) return;
      
      // 如果已经绑定过，不再重复绑定
      if (container.dataset.tasksEventsBound === 'true') {
        return;
      }
      container.dataset.tasksEventsBound = 'true';
      
      this._eventHandlers = {};
      
      this._eventHandlers.click = function(e) {
        if (e.target.closest('#back-btn')) {
          LifeGame.emit('nav:back');
          return;
        }
        
        var mainTab = e.target.closest('.main-tab');
        if (mainTab) {
          var filter = mainTab.dataset.filter;
          if (filter && filter !== self.currentFilter) {
            self.currentFilter = filter;
            self.currentDateOffset = 0;
            self.showDateSwitcher = false;
            self.debouncedRender();
          }
          return;
        }
        
        if (e.target.closest('#close-switcher')) {
          self.showDateSwitcher = false;
          self.debouncedRender();
          return;
        }
        
        var dateBtn = e.target.closest('.date-btn');
        if (dateBtn) {
          self.currentDateOffset = parseInt(dateBtn.dataset.offset);
          self.debouncedRender();
          return;
        }
        
        var typeBtn = e.target.closest('.type-btn:not(.type-btn-add)');
        if (typeBtn) {
          self.currentType = typeBtn.dataset.type;
          self.debouncedRender();
          return;
        }
        
        if (e.target.closest('#show-completed-btn')) {
          self.showCompleted = !self.showCompleted;
          self.debouncedRender();
          return;
        }
        
        var taskChk = e.target.closest('.task-chk, .task-chk-square');
        if (taskChk) {
          e.stopPropagation();
          var taskId = taskChk.dataset.taskId;
          var subtaskId = taskChk.dataset.subtaskId;
          var parentId = taskChk.dataset.parentId;
          
          if (subtaskId && parentId) {
            self.toggleSubtask(parentId, subtaskId);
          } else {
            self.toggleTask(taskId);
          }
          return;
        }
        
        var taskCardGrid = e.target.closest('.task-card-grid');
        if (taskCardGrid) {
          if (e.target.closest('.task-chk, .task-chk-square')) return;
          var taskId = taskCardGrid.dataset.taskId;
          if (taskId) {
            self.toggleTask(taskId);
          }
          return;
        }
        
        var longCompleteBtn = e.target.closest('.long-complete-btn, .grade-complete-btn, .long-card-complete-btn');
        if (longCompleteBtn) {
          e.stopPropagation();
          var taskId = longCompleteBtn.dataset.task;
          if (taskId) {
            self.toggleTask(taskId);
          }
          return;
        }
        
        var subtaskChk = e.target.closest('.subtask-chk');
        if (subtaskChk) {
          var taskId = subtaskChk.dataset.task;
          var subId = subtaskChk.dataset.sub;
          self.toggleSubtask(taskId, subId);
          return;
        }
        
        if (e.target.closest('#add-task-btn')) {
          e.stopPropagation();
          self.openAddTask();
          return;
        }
        
        var editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
          e.stopPropagation();
          var taskId = editBtn.dataset.task;
          self.editTask(taskId);
          return;
        }
        
        var addBtn = e.target.closest('.add-btn');
        if (addBtn) {
          e.stopPropagation();
          var taskId = addBtn.dataset.task;
          var task = self.data.find(function(t) { return t.id === taskId; });
          if (task) {
            self.openTaskDetail(task);
          }
          return;
        }
        
        var inboxBtn = e.target.closest('.inbox-btn, .inbox-btn-grid, .inbox-btn-card');
        if (inboxBtn) {
          e.preventDefault();
          e.stopPropagation();
          var taskId = inboxBtn.dataset.task;
          var action = inboxBtn.dataset.action;
          self.moveFromInbox(taskId, action);
          return;
        }
      };
      
      container.addEventListener('click', this._eventHandlers.click);
      
      // 双击事件 - 使用 click 事件检测，与 DragMouse 协调
      var clickTimer = null;
      var clickCount = 0;
      var lastClickCard = null;
      var lastClickTime = 0;
      
      // 双击检测：使用 mousedown 来捕获快速点击，但兼容 DragMouse
      this._eventHandlers.mousedown = function(e) {
        // 只处理左键
        if (e.button !== 0) return;
        
        // 获取卡片
        var card = e.target.closest('.long-task-card');
        if (!card) {
          lastClickCard = null;
          clickCount = 0;
          return;
        }
        
        // 排除按钮区域
        if (e.target.closest('button') || 
            e.target.closest('.long-card-complete-btn') ||
            e.target.closest('input[type="checkbox"]')) {
          return;
        }
        
        var taskId = card.dataset.taskId;
        var now = Date.now();
        
        // 如果点击的是不同卡片，重置计数
        if (lastClickCard !== taskId) {
          lastClickCard = taskId;
          clickCount = 1;
          lastClickTime = now;
          return;
        }
        
        // 同一卡片，检查时间间隔
        if (now - lastClickTime < 350) {
          // 双击检测成功！
          clickCount = 0;
          lastClickCard = null;
          
          if (!taskId) return;
          
          var task = self.data.find(function(t) { return t.id === taskId; });
          if (!task) return;
          
          // 阻止 DragMouse 启动拖拽（如果它还没启动）
          if (window.DragMouse && DragMouse.dragStartTimer) {
            clearTimeout(DragMouse.dragStartTimer);
            DragMouse.dragStartTimer = null;
            DragMouse.pendingItem = null;
          }
          
          LifeGame.log('[tasks] 双击打开详情:', taskId);
          
          if (task.period === 'long' || task.period === 'longterm') {
            self.openTaskDetail(task);
          } else if (task.period === 'today' || task.period === 'inbox') {
            self.editTask(taskId);
          }
        } else {
          // 时间太长，算作第一次点击
          clickCount = 1;
          lastClickTime = now;
        }
      };
      
      container.addEventListener('mousedown', this._eventHandlers.mousedown);
      
      // 移动端长按菜单
      this._eventHandlers.touchStart = function(e) {
        if (!MobileUtils || !MobileUtils.isTouchDevice || !MobileUtils.isTouchDevice()) {
          return;
        }
        
        var card = e.target.closest('.long-task-card[data-task-id]');
        if (!card) return;
        
        // 如果点击的是按钮，不触发长按
        if (e.target.closest('.task-btn') || e.target.closest('.subtask-chk') || 
            e.target.closest('.grade-complete-btn') || 
            e.target.closest('.long-card-complete-btn') || e.target.closest('.inbox-btn-card') ||
            e.target.closest('.task-chk-square') || e.target.closest('.long-card-progress-wrap')) return;
        
        var taskId = card.dataset.taskId;
        var task = self.data.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        // 显示长按菜单
        var touch = e.touches[0];
        var menuItems = self.createCardContextMenu(task);
        MobileUtils.createContextMenu(menuItems, {
          x: touch.clientX,
          y: touch.clientY
        });
      };
      
      // 绑定长按事件
      if (MobileUtils && MobileUtils.addLongPressListener) {
        var cards = container.querySelectorAll('.long-task-card[data-task-id]');
        cards.forEach(function(card) {
          MobileUtils.addLongPressListener(card, function(e) {
            var touch = e.touches ? e.touches[0] : e;
            var taskId = card.dataset.taskId;
            var task = self.data.find(function(t) { return t.id === taskId; });
            if (task) {
              var menuItems = self.createCardContextMenu(task);
              MobileUtils.createContextMenu(menuItems, {
                x: touch.clientX,
                y: touch.clientY
              });
            }
          }, 500);
        });
      }
      
      this._eventHandlers.mouseover = function(e) {
        var card = e.target.closest('.task-card-grid');
        if (card && !card.dataset.tooltipBound) {
          card.dataset.tooltipBound = 'true';
          var taskId = card.dataset.taskId;
          var subtaskId = card.dataset.subtaskId;
          var parentId = card.dataset.parentId;
          
          var task = null;
          if (subtaskId && parentId) {
            var parent = self.data.find(function(t) { return t.id === parentId; });
            if (parent && parent.subtasks) {
              task = parent.subtasks.find(function(s) { return s.id === subtaskId; });
            }
          } else if (taskId) {
            task = self.data.find(function(t) { return t.id === taskId; });
          }
          
          if (task) {
            // 桌面端：hover 显示 tooltip
            // 移动端：点击显示 tooltip（非按钮区域）
            if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
              // 移动端：点击卡片空白处显示 tooltip
              card.addEventListener('click', function(e) {
                // 如果点击的是按钮、复选框等，不显示 tooltip
                if (e.target.closest('.task-btn') || 
                    e.target.closest('.task-checkbox') ||
                    e.target.closest('.long-card-complete-btn') ||
                    e.target.closest('.inbox-btn-card') ||
                    e.target.closest('.toggle-subtasks')) {
                  return;
                }
                // 切换 tooltip 显示/隐藏
                if (self.tooltipEl && self.tooltipEl.dataset.taskId === task.id) {
                  self.hideTaskTooltip();
                } else {
                  self.showTaskTooltip(task, card);
                }
              });
            } else {
              // 桌面端：hover 显示 tooltip
              card.addEventListener('mouseenter', function(e) {
                self.showTaskTooltip(task, card);
              });
              card.addEventListener('mouseleave', function() {
                self.hideTaskTooltip();
              });
            }
          }
        }
      };
      
      container.addEventListener('mouseover', this._eventHandlers.mouseover);
    },
    
    /**
     * 初始化拖拽排序
     */
    initDragSort: function() {
      var self = this;
      var worldContent = document.getElementById('world-content');
      if (!worldContent) {
        LifeGame.log('[tasks] world-content 未找到');
        return;
      }
      
      var grid = worldContent.querySelector('.task-grid');
      if (!grid) {
        LifeGame.log('[tasks] 未找到任务网格，跳过拖拽初始化');
        return;
      }
      
      var storageKey = 'task_order_' + this.currentFilter;
      
      var itemSelector = '.long-task-card';
      if (this.currentFilter === 'long') {
        itemSelector = '.long-task-card.long-type';
      } else if (this.currentFilter === 'inbox') {
        itemSelector = '.long-task-card.inbox-type';
      } else if (this.currentFilter === 'today') {
        itemSelector = '.long-task-card.today-type';
      }
      
      LifeGame.log('[tasks] 初始化拖拽:', storageKey, '选择器:', itemSelector);
      
      // 使用 DragMouse（鼠标事件模拟拖拽）- 最可靠的方式
      if (window.DragMouse) {
        LifeGame.log('[tasks] 使用 DragMouse（鼠标事件模拟）初始化拖拽');
        window.DragMouse.init(grid, itemSelector, storageKey, function(newOrder) {
          LifeGame.log('[tasks] 新排序:', newOrder);
          self.saveTaskOrder(storageKey, newOrder);
        });
      } else if (window.DragSortSimple) {
        // 降级到 HTML5 Drag and Drop 方案
        LifeGame.log('[tasks] 使用 DragSortSimple 初始化拖拽');
        window.DragSortSimple.init(grid, itemSelector, storageKey, function(newOrder) {
          LifeGame.log('[tasks] 新排序:', newOrder);
          self.saveTaskOrder(storageKey, newOrder);
        });
      } else if (window.DragSort) {
        LifeGame.log('[tasks] 使用旧版 DragSort');
        var items = grid.querySelectorAll(itemSelector);
        items.forEach(function(item) {
          item.draggable = true;
          item.style.cursor = 'grab';
        });
        window.DragSort.init(grid, itemSelector, storageKey, function(newOrder) {
          LifeGame.log('[tasks] 新排序:', newOrder);
          self.saveTaskOrder(storageKey, newOrder);
        });
      } else {
        LifeGame.warn('[tasks] 没有可用的拖拽库');
      }
      
      // 初始化子任务拖拽
      worldContent.querySelectorAll('.subtasks').forEach(function(subtaskList) {
        var taskId = subtaskList.id.replace('subtasks-', '');
        if (!taskId) return;
        
        if (window.DragMouse) {
          window.DragMouse.init(subtaskList, '.subtask-row', 'subtask_order_' + taskId, function(newOrder) {
            // 子任务排序回调
          });
        } else if (window.DragSort) {
          window.DragSort.init(subtaskList, '.subtask-row', 'subtask_order_' + taskId, function(newOrder) {
          });
        }
      });
    },
    
    /**
     * 保存任务排序
     * @param {string} key - 存储键
     * @param {Array} order - 排序数组
     */
    saveTaskOrder: function(key, order) {
      LifeGame.core.Storage.set(key, order);
    },
    
    /**
     * 应用保存的排序
     * @param {Array} tasks - 任务数组
     * @param {string} filter - 过滤器
     * @returns {Array} 排序后的任务数组
     */
    applyTaskOrder: function(tasks, filter) {
      // 直接从 localStorage 读取排序（排序数据单独存储）
      var savedOrder = null;
      try {
        var savedStr = localStorage.getItem('task_order_' + filter);
        if (savedStr) {
          savedOrder = JSON.parse(savedStr);
        }
      } catch(e) {}
      
      if (!savedOrder || savedOrder.length === 0) return tasks;
      
      var ordered = [];
      var remaining = tasks.slice();
      
      savedOrder.forEach(function(id) {
        var idx = remaining.findIndex(function(t) { return t.id === id; });
        if (idx !== -1) {
          ordered.push(remaining[idx]);
          remaining.splice(idx, 1);
        }
      });
      
      return ordered.concat(remaining);
    },
    
    expTargets: {
      'F': 1,
      'E': 5,
      'D': 10,
      'C': 100,
      'B': 1000,
      'A': 10000,
      'S': 100000,
      'SS': 1000000,
      'SSS': 10000000
    },
    
    /**
     * 切换任务完成状态
     * @param {string} taskId - 任务ID
     */
    toggleTask: function(taskId) {
      var task = this.data.find(function(t) { return t.id === taskId; });
      if (!task) return;
      
      if (task.period === 'long' || task.period === 'longterm') {
        if (!task.done) {
          var currentExp = this.calculateTaskExp(task);
          var targetExp = this.expTargets[task.diff] || 1;
          
          if (currentExp < targetExp) {
            alert('经验不足！当前 ' + currentExp + ' / 目标 ' + targetExp + '，请继续完成子任务！');
            return;
          }
          
          var self = this;
          var diffOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
          var currentDiffIndex = diffOrder.indexOf(task.diff || 'F');
          var canUpgrade = currentDiffIndex < diffOrder.length - 1;
          
          var choice = confirm(
            '🎉 恭喜！长期任务【' + task.n + '】已达到目标经验！\n' +
            '当前：' + currentExp + '/' + targetExp + ' (' + task.diff + '级)\n\n' +
            '点击【确定】：完成任务并获得奖励\n' +
            '点击【取消】：' + (canUpgrade ? '升级任务到更高难度继续挑战' : '保持当前状态')
          );
          
          if (choice) {
            task.done = true;
            task.completedAt = new Date().toISOString();
            this.saveAndEmit(task);
            this.debouncedRender();
            alert('✅ 任务完成！获得成就奖励！');
          } else if (canUpgrade) {
            var nextDiff = diffOrder[currentDiffIndex + 1];
            var nextTarget = this.expTargets[nextDiff];
            var confirmUpgrade = confirm(
              '升级任务难度？\n' +
              task.diff + '级 → ' + nextDiff + '级\n' +
              '目标经验：' + targetExp + ' → ' + nextTarget + '\n\n' +
              '升级后：\n' +
              '- 任务难度提升\n' +
              '- 已获得经验 ' + currentExp + ' 将保留\n' +
              '- 需要更多经验才能完成\n\n' +
              '确定升级吗？'
            );
            
            if (confirmUpgrade) {
              task.diff = nextDiff;
              this.saveAndEmit(task);
              this.debouncedRender();
              alert('🆙 任务已升级到 ' + nextDiff + ' 级！继续加油！');
            }
          }
          return;
        }
      }
      
      // 添加确认对话框（今日任务和收集箱）
      if (task.period === 'today' || task.period === 'inbox') {
        var action = task.done ? '取消完成' : '完成';
        var confirmMsg = '确认' + action + '任务【' + task.n + '】吗？';
        if (!confirm(confirmMsg)) {
          return; // 用户取消
        }
      }
      
      var wasDone = task.done;
      task.done = !task.done;
      
      // 计算经验值变化
      var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
      var expChange = expMap[task.diff] || 1;
      
      // 如果是今日任务或收集箱的完成操作，显示完成提示后执行动画
      if ((task.period === 'today' || task.period === 'inbox') && task.done) {
        // 先显示任务完成提示，用户点击确定后再执行动画
        alert('🎉 任务完成！');
        this.animateTaskCompletion(task);
        
        // 添加撤销功能
        var self = this;
        if (LifeGame.addUndoable) {
          LifeGame.addUndoable(
            'complete',
            '已完成任务「' + (task.n || '无标题') + '」',
            function(data) {
              // 撤销完成：标记为未完成
              var t = self.data.find(function(item) { return item.id === data.taskId; });
              if (t) {
                t.done = false;
                t.completedAt = null;
                self.saveAndEmit(t);
                self.debouncedRender();
              }
            },
            { taskId: task.id, expChange: expChange }
          );
        }
        return;
      }
      
      // 如果是取消完成，也添加撤销
      if (!task.done && wasDone && (task.period === 'today' || task.period === 'inbox')) {
        var self = this;
        if (LifeGame.addUndoable) {
          LifeGame.addUndoable(
            'uncomplete',
            '已取消完成任务「' + (task.n || '无标题') + '」',
            function(data) {
              // 撤销取消完成：重新标记为完成
              var t = self.data.find(function(item) { return item.id === data.taskId; });
              if (t) {
                t.done = true;
                t.completedAt = new Date().toISOString();
                self.saveAndEmit(t);
                self.debouncedRender();
              }
            },
            { taskId: task.id, expChange: expChange }
          );
        }
      }
      
      if (task.done) {
        LifeGame.emit('task:completed', { 
          task: task,
          name: task.n,
          isLongTask: task.period === 'long' || task.period === 'longterm',
          expChange: expChange
        });
      }
      
      this.saveAndEmit(task);
      
      if (this.currentDetailTask) {
        this.currentDetailTask = null;
        LifeGame.emit('nav:back');
      } else {
        this.debouncedRender();
      }
    },
    
    /**
     * 显示任务完成动画
     * @param {Object} task - 任务对象
     */
    animateTaskCompletion: function(task) {
      var self = this;
      var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
      var expChange = expMap[task.diff] || 1;
      
      // 查找对应的 DOM 元素
      var worldContent = document.getElementById('world-content');
      if (!worldContent) {
        // 如果找不到容器，直接保存并刷新
        this.saveAndEmit(task);
        LifeGame.emit('task:completed', { 
          task: task,
          name: task.n,
          isLongTask: false,
          expChange: expChange
        });
        this.debouncedRender();
        return;
      }
      
      // 根据任务类型选择正确的选择器
      var typeClass = task.period === 'today' ? 'today-type' : 'inbox-type';
      var card = worldContent.querySelector('.long-task-card.' + typeClass + '[data-task-id="' + task.id + '"]');
      
      if (!card) {
        // 如果找不到卡片，直接保存并刷新
        this.saveAndEmit(task);
        LifeGame.emit('task:completed', { 
          task: task,
          name: task.n,
          isLongTask: false,
          expChange: expChange
        });
        this.debouncedRender();
        return;
      }
      
      // 添加完成动画类
      card.classList.add('task-completing');
      
      // 更新复选框显示
      var checkbox = card.querySelector('.task-chk-square');
      if (checkbox) {
        checkbox.classList.add('checked');
      }
      
      // 触发完成事件
      LifeGame.emit('task:completed', { 
        task: task,
        name: task.n,
        isLongTask: false,
        expChange: expChange
      });
      
      // 保存数据
      this.saveAndEmit(task);
      
      // 延迟后隐藏卡片 - 延长到1.2秒让用户看清楚
      setTimeout(function() {
        card.classList.add('task-completed-hidden');
        
        // 再延迟后重新渲染（彻底移除已完成的任务）
        setTimeout(function() {
          self.debouncedRender();
        }, 300);
      }, 1200);
    },
    
    /**
     * 切换子任务完成状态
     * @param {string} taskId - 父任务ID
     * @param {string} subId - 子任务ID
     */
    toggleSubtask: function(taskId, subId) {
      var task = this.data.find(function(t) { return t.id === taskId; });
      if (!task || !task.subtasks) return;
      
      var sub = task.subtasks.find(function(s) { return s.id === subId; });
      if (!sub) return;
      
      // 添加确认对话框
      var action = sub.done ? '取消完成' : '完成';
      var confirmMsg = '确认' + action + '子任务【' + sub.n + '】吗？';
      if (!confirm(confirmMsg)) {
        return; // 用户取消
      }
      
      sub.done = !sub.done;
      
      if (!sub.daily) {
        var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
        var expChange = expMap[sub.diff] || expMap[task.diff] || 1;
        
        if (sub.done) {
          var profile = LifeGame.core.Storage.get('profile') || {};
          profile.exp = (profile.exp || 0) + expChange;
          LifeGame.core.Storage.set('profile', profile);
          LifeGame.emit('user:exp:gained', { exp: expChange, total: profile.exp });
          
          if (task.period === 'long' || task.period === 'longterm') {
            task.totalExp = (task.totalExp || 0) + expChange;
            LifeGame.emit('task:exp:gained', { task: task, exp: expChange, total: task.totalExp });
          }
          
          LifeGame.emit('task:completed', {
            task: sub,
            name: sub.n || '子任务',
            subtaskName: sub.n || '子任务',
            parentName: task.n || '长期任务',
            taskName: task.n || '长期任务',
            isLongTask: task.period === 'long' || task.period === 'longterm',
            isSubtask: true,
            parentId: task.id,
            expChange: expChange
          });
        } else {
          var profile = LifeGame.core.Storage.get('profile') || {};
          profile.exp = Math.max(0, (profile.exp || 0) - expChange);
          LifeGame.core.Storage.set('profile', profile);
          LifeGame.emit('user:exp:lost', { exp: expChange, total: profile.exp });
          
          if (task.period === 'long' || task.period === 'longterm') {
            task.totalExp = Math.max(0, (task.totalExp || 0) - expChange);
            LifeGame.emit('task:exp:lost', { task: task, exp: expChange, total: task.totalExp });
          }
        }
      }
      
      // 子任务完成提示
      if (sub.done) {
        alert('🎉 子任务完成！');
      }
      
      this.saveAndEmit(task);
      
      if (this.currentDetailTask) {
        this.renderDetailPage();
      } else {
        this.debouncedRender();
      }
    },
    
    /**
     * 保存任务并触发事件
     * @param {Object} task - 任务对象
     */
    saveAndEmit: function(task) {
      LifeGame.core.Storage.set('tasks', this.data);
      LifeGame.emit('task:updated', { task: task });
    },
    
    /**
     * 给长期任务增加经验（通过任务名称）
     * @param {string} taskName - 任务名称
     * @param {number} amount - 经验值
     */
    addExpToLongTaskByName: function(taskName, amount) {
      if (!taskName || !amount) return;
      
      var task = this.data.find(function(t) {
        return (t.period === 'long' || t.period === 'longterm') && t.n === taskName;
      });
      
      if (task) {
        task.totalExp = (task.totalExp || 0) + amount;
        this.saveAndEmit(task);
        LifeGame.emit('task:exp:gained', { task: task, exp: amount, total: task.totalExp });
      }
    },
    
    /**
     * 从长期任务扣除经验（通过任务名称）
     * @param {string} taskName - 任务名称
     * @param {number} amount - 经验值
     */
    deductExpFromLongTaskByName: function(taskName, amount) {
      if (!taskName || !amount) return;
      
      var task = this.data.find(function(t) {
        return (t.period === 'long' || t.period === 'longterm') && t.n === taskName;
      });
      
      if (task) {
        task.totalExp = Math.max(0, (task.totalExp || 0) - amount);
        this.saveAndEmit(task);
        LifeGame.emit('task:exp:lost', { task: task, exp: amount, total: task.totalExp });
      }
    },
    
    /**
     * 打开添加任务表单
     */
    openAddTask: function() {
      this.renderForm(null);
    },
    
    /**
     * 编辑任务
     * @param {string} taskId - 任务ID
     */
    editTask: function(taskId) {
      var task = this.data.find(function(t) { return t.id === taskId; });
      if (!task) return;
      this.renderEditForm(task);
    },
    
    /**
     * 删除任务
     * @param {string} taskId - 任务ID
     */
    deleteTask: function(taskId) {
      if (!confirm('确定要删除这个任务吗？')) return;
      
      var idx = this.data.findIndex(function(t) { return t.id === taskId; });
      if (idx > -1) {
        var deleted = this.data.splice(idx, 1)[0];
        var deletedIndex = idx; // 保存索引以便撤销时恢复位置
        LifeGame.core.Storage.set('tasks', this.data);
        LifeGame.emit('task:deleted', { task: deleted });
        this.debouncedRender();
        
        // 添加撤销功能
        var self = this;
        if (LifeGame.addUndoable) {
          LifeGame.addUndoable(
            'delete',
            '已删除任务「' + (deleted.n || '无标题') + '」',
            function(data) {
              // 撤销删除：恢复任务
              self.data.splice(data.index, 0, data.task);
              LifeGame.core.Storage.set('tasks', self.data);
              LifeGame.emit('task:restored', { task: data.task });
              self.debouncedRender();
            },
            { task: deleted, index: deletedIndex }
          );
        }
      }
    },
    
    renderAddForm: function() {
      this.renderForm(null);
    },
    
    renderEditForm: function(task) {
      this.renderForm(task);
    },
    
    /**
     * 渲染表单
     * @param {Object} task - 任务对象（null表示新建）
     */
    renderForm: function(task) {
      var self = this;
      
      if (window.NavController && NavController.showSubPage) {
        NavController.showSubPage(function(container) {
          self.renderFormToContainer(task, container);
        });
        return;
      }
      
      var container = document.getElementById('world-content') || document.getElementById('app');
      if (!container) return;
      this.renderFormToContainer(task, container);
    },
    
    /**
     * 渲染表单到容器
     * @param {Object} task - 任务对象
     * @param {HTMLElement} container - 容器元素
     */
    renderFormToContainer: function(task, container) {
      var isEdit = !!task;
      var isToday = isEdit ? task.period === 'today' : this.currentFilter === 'today';
      var isInbox = isEdit ? task.period === 'inbox' : this.currentFilter === 'inbox';
      var isLong = isEdit ? (task.period === 'long' || task.period === 'longterm') : this.currentFilter === 'long';
      
      var title = isEdit ? '编辑任务' : '添加' + (isToday ? '今日' : (isInbox ? '收集箱' : '长期')) + '任务';
      
      var name = isEdit ? task.n : '';
      var sub = isEdit ? (task.sub || '') : '';
      var typeMain = isEdit && task.type === 'main' ? 'selected' : '';
      var typeSide = isEdit && task.type === 'side' ? 'selected' : (!isEdit ? '' : 'selected');
      if (!isEdit) typeMain = 'selected';
      
      var diffs;
      var diffLimitHint = '';
      
      if (isToday || isInbox) {
        diffs = ['C', 'D', 'E', 'F'];
        diffLimitHint = '<div class="diff-limit-hint">💡 今日/收集箱任务最高只能创建C级</div>';
      } else if (isLong) {
        diffs = ['A', 'B', 'C'];
        diffLimitHint = '<div class="diff-limit-hint">💡 长期任务只能创建C/B/A级，S级以上需通过升级获得</div>';
      } else {
        diffs = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
      }
      
      var diffLabels = { 'SSS': 'SSS - 神话', 'SS': 'SS - 传说', 'S': 'S - 史诗', 'A': 'A - 大师', 'B': 'B - 专家', 'C': 'C - 进阶', 'D': 'D - 熟练', 'E': 'E - 学徒', 'F': 'F - 初心' };
      var diffOptions = diffs.map(function(d) {
        var selected = isEdit && task.diff === d ? 'selected' : (!isEdit && d === 'F' ? 'selected' : '');
        return '<option value="' + d + '" ' + selected + '>' + diffLabels[d] + '</option>';
      }).join('');
      
      var dateFieldHtml = '';
      if (isToday || isInbox) {
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        var tomorrowStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
        var dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);
        var dayAfterStr = dayAfter.getFullYear() + '-' + String(dayAfter.getMonth() + 1).padStart(2, '0') + '-' + String(dayAfter.getDate()).padStart(2, '0');
        
        var existingDate = isEdit && task.targetDate ? task.targetDate : '';
        
        dateFieldHtml = 
          '<div class="form-group">' +
            '<label>备注时间（可选）</label>' +
            '<div class="date-quick-btns">' +
              '<button type="button" class="date-quick-btn" data-date="' + todayStr + '">今天</button>' +
              '<button type="button" class="date-quick-btn" data-date="' + tomorrowStr + '">明天</button>' +
              '<button type="button" class="date-quick-btn" data-date="' + dayAfterStr + '">后天</button>' +
            '</div>' +
            '<input type="date" id="task-date" value="' + existingDate + '" class="form-input">' +
            '<div class="date-hint">选择日期后会显示在任务卡片上</div>' +
          '</div>';
      }
      
      container.innerHTML = 
        '<div class="add-task-form">' +
          '<h3 class="form-title">' + title + '</h3>' +
          '<div class="form-group">' +
            '<label>任务名称</label>' +
            '<input type="text" id="task-name" placeholder="输入任务名称..." value="' + name + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>任务类型</label>' +
            '<select id="task-type">' +
              '<option value="main" ' + typeMain + '>🚩 主线任务</option>' +
              '<option value="side" ' + typeSide + '>💠 支线任务</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>难度等级</label>' +
            '<select id="task-diff">' + diffOptions + '</select>' +
            diffLimitHint +
          '</div>' +
          '<div class="form-group">' +
            '<label>备注（可选）</label>' +
            '<input type="text" id="task-sub" placeholder="补充说明..." value="' + sub + '">' +
          '</div>' +
          dateFieldHtml +
          '<button class="save-task-btn" id="save-task-btn">' + (isEdit ? '保存修改' : '保存任务') + '</button>' +
        '</div>';
      
      this.attachFormEvents(task, container);
    },
    
    /**
     * 绑定表单事件
     * @param {Object} task - 任务对象
     * @param {HTMLElement} container - 容器元素
     */
    attachFormEvents: function(task, container) {
      var self = this;
      var isEdit = !!task;
      
      var backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          LifeGame.emit('nav:back');
        });
      }
      
      var saveBtn = document.getElementById('save-task-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          if (isEdit) {
            self.saveEditTask(task);
          } else {
            self.saveNewTask();
          }
        });
      }
      
      var dateQuickBtns = document.querySelectorAll('.date-quick-btn');
      if (dateQuickBtns.length > 0) {
        dateQuickBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            var dateInput = document.getElementById('task-date');
            if (dateInput) {
              dateInput.value = this.dataset.date;
              document.querySelectorAll('.date-quick-btn').forEach(function(b) {
                b.classList.remove('active');
              });
              this.classList.add('active');
            }
          });
        });
      }
    },
    
    /**
     * 保存编辑的任务
     * @param {Object} task - 任务对象
     */
    saveEditTask: function(task) {
      var name = document.getElementById('task-name').value.trim();
      var type = document.getElementById('task-type').value;
      var diff = document.getElementById('task-diff').value;
      var sub = document.getElementById('task-sub').value.trim();
      var dateInput = document.getElementById('task-date');
      var targetDate = dateInput ? dateInput.value : '';
      
      if (!name) {
        alert('请输入任务名称');
        return;
      }
      
      task.n = name;
      task.type = type;
      task.diff = diff;
      task.sub = sub || undefined;
      
      if (targetDate) {
        task.targetDate = targetDate;
      } else {
        delete task.targetDate;
      }
      
      LifeGame.core.Storage.set('tasks', this.data);
      LifeGame.emit('task:updated', { task: task });
      
      LifeGame.emit('nav:back');
    },
    
    /**
     * 从收集箱移动任务
     * @param {string} taskId - 任务ID
     * @param {string} action - 操作类型
     */
    moveFromInbox: function(taskId, action) {
      var task = this.data.find(function(t) { return t.id === taskId; });
      if (!task) return;
      
      if (action === 'today') {
        task.period = 'today';
        LifeGame.core.Storage.set('tasks', this.data);
        LifeGame.emit('task:moved', { task: task, from: 'inbox', to: 'today' });
        this.debouncedRender();
      } else if (action === 'tomorrow') {
        task.period = 'today';
        task.targetDate = this.getDateStr(1);
        LifeGame.core.Storage.set('tasks', this.data);
        LifeGame.emit('task:moved', { task: task, from: 'inbox', to: 'tomorrow' });
        this.debouncedRender();
      } else if (action === 'link') {
        this.showLinkToLongTaskDialog(task);
      }
    },
    
    /**
     * 显示关联到长期任务的对话框
     * @param {Object} task - 收集箱任务
     */
    showLinkToLongTaskDialog: function(task) {
      var self = this;
      
      var longTasks = this.data.filter(function(t) {
        return t.period === 'long' || t.period === 'longterm';
      });
      
      if (longTasks.length === 0) {
        alert('暂无长期任务，请先创建一个长期任务');
        return;
      }
      
      this.renderLinkDialog(task, longTasks);
    },
    
    /**
     * 渲染关联选择界面
     * @param {Object} inboxTask - 收集箱任务
     * @param {Array} longTasks - 长期任务列表
     */
    renderLinkDialog: function(inboxTask, longTasks) {
      var self = this;
      
      // 使用 NavController 来渲染子页面，这样返回按钮能正确工作
      if (window.NavController && NavController.showSubPage) {
        NavController.showSubPage(function(container) {
          self.renderLinkDialogContent(inboxTask, longTasks, container);
        });
      } else {
        // 降级方案：直接渲染
        var container = document.getElementById('world-content') || document.getElementById('app');
        if (!container) return;
        this.renderLinkDialogContent(inboxTask, longTasks, container);
      }
    },
    
    renderLinkDialogContent: function(inboxTask, longTasks, container) {
      var self = this;
      
      // 获取等级颜色
      var gradeColors = {
        'F': '#9ca3af', 'E': '#a0826d', 'D': '#60a5fa', 'C': '#4ade80',
        'B': '#c084fc', 'A': '#fbbf24', 'S': '#f87171', 'SS': '#f59e0b', 'SSS': '#fcd34d'
      };
      
      var taskListHtml = longTasks.map(function(t) {
        var currentExp = self.calculateTaskExp(t);
        var targetExp = self.expTargets[t.diff] || 1;
        var expPercent = Math.min(100, (currentExp / targetExp) * 100);
        var gradeColor = gradeColors[t.diff] || '#9ca3af';
        var typeText = t.type === 'main' ? '主线' : (t.type === 'side' ? '支线' : '');
        var typeClass = t.type === 'main' ? 'main' : (t.type === 'side' ? 'side' : '');
        
        return '<div class="link-long-card" data-task-id="' + t.id + '">' +
          '<div class="link-long-card-border" style="border-color: ' + gradeColor + '"></div>' +
          '<div class="link-long-card-content">' +
            '<div class="link-long-card-header">' +
              '<span class="link-long-card-grade" style="background: ' + gradeColor + ';">' + (t.diff || 'F') + '</span>' +
              '<span class="link-long-card-name">' + escapeHtml(t.n) + '</span>' +
              (typeText ? '<span class="link-long-card-type ' + typeClass + '">' + typeText + '</span>' : '') +
            '</div>' +
            '<div class="link-long-card-progress">' +
              '<div class="link-long-card-bar-bg">' +
                '<div class="link-long-card-bar-fill" style="width:' + expPercent + '%; background: ' + gradeColor + ';"></div>' +
              '</div>' +
              '<span class="link-long-card-exp">' + currentExp + '/' + targetExp + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      
      // 收集箱任务卡片样式
      var inboxGradeColor = gradeColors[inboxTask.diff] || '#9ca3af';
      var inboxTypeText = inboxTask.type === 'main' ? '主线' : (inboxTask.type === 'side' ? '支线' : '普通');
      var inboxTypeClass = inboxTask.type === 'main' ? 'main' : (inboxTask.type === 'side' ? 'side' : '');
      
      container.innerHTML = 
        '<div class="link-dialog">' +
          '<div class="link-dialog-header-no-back">' +
            '<h3>关联到长期任务</h3>' +
          '</div>' +
          '<div class="link-dialog-content">' +
            '<div class="link-section-title">📥 收集箱任务</div>' +
            '<div class="link-inbox-card" style="border-color: ' + inboxGradeColor + ';">' +
              '<div class="link-inbox-card-border" style="background: ' + inboxGradeColor + ';"></div>' +
              '<div class="link-inbox-card-content">' +
                '<div class="link-inbox-card-header">' +
                  '<span class="link-inbox-card-grade" style="background: ' + inboxGradeColor + ';">' + (inboxTask.diff || 'F') + '</span>' +
                  '<span class="link-inbox-card-name">' + escapeHtml(inboxTask.n) + '</span>' +
                  (inboxTypeClass ? '<span class="link-inbox-card-type ' + inboxTypeClass + '">' + inboxTypeText + '</span>' : '') +
                '</div>' +
                '<div class="link-inbox-card-sub">' + (inboxTask.sub || '无备注') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="link-section-title">📋 选择要关联的长期任务</div>' +
            '<div class="link-task-list">' + taskListHtml + '</div>' +
            '<div class="link-or-divider">或</div>' +
            '<button class="link-create-new-btn" id="link-create-new">➕ 创建新的长期任务</button>' +
          '</div>' +
        '</div>';
      
      document.querySelectorAll('.link-long-card').forEach(function(item) {
        item.addEventListener('click', function() {
          var taskId = this.dataset.taskId;
          var targetTask = longTasks.find(function(t) { return t.id === taskId; });
          if (targetTask) {
            self.linkTaskToLong(inboxTask, targetTask);
          }
        });
      });
      
      var linkCreateNew = document.getElementById('link-create-new');
      if (linkCreateNew) {
        linkCreateNew.addEventListener('click', function() {
          self.convertInboxToLong(inboxTask);
        });
      }
    },
    
    /**
     * 将收集箱任务转换为新的长期任务
     * @param {Object} task - 收集箱任务
     */
    convertInboxToLong: function(task) {
      task.period = 'long';
      task.subtasks = [];
      LifeGame.core.Storage.set('tasks', this.data);
      LifeGame.emit('task:moved', { task: task, from: 'inbox', to: 'long' });
      alert('已转换为新的长期任务');
      // 返回收集箱列表（使用NavController返回）
      this.currentFilter = 'inbox';
      if (window.NavController && NavController.popFromNavStack) {
        NavController.popFromNavStack(function() {
          var container = document.getElementById('world-content');
          if (container && LifeGame.modules.Tasks.render) {
            LifeGame.modules.Tasks.render(container);
          }
        });
      } else {
        var container = document.getElementById('world-content') || document.getElementById('app');
        if (container) this.render(container);
      }
    },
    
    /**
     * 将收集箱任务关联为长期任务的子任务
     * @param {Object} inboxTask - 收集箱任务
     * @param {Object} longTask - 长期任务
     */
    linkTaskToLong: function(inboxTask, longTask) {
      if (!longTask.subtasks) longTask.subtasks = [];
      
      var subtask = {
        id: 'sub_' + Date.now(),
        n: inboxTask.n,
        done: false,
        diff: inboxTask.diff || 'F',
        date: this.getDateStr(0),
        sub: inboxTask.sub || ''
      };
      
      longTask.subtasks.push(subtask);
      
      this.data = this.data.filter(function(t) { return t.id !== inboxTask.id; });
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      LifeGame.emit('task:linked', { 
        inboxTask: inboxTask, 
        longTask: longTask, 
        subtask: subtask 
      });
      
      alert('已关联到长期任务：' + longTask.n);
      // 返回收集箱列表（使用NavController返回）
      this.currentFilter = 'inbox';
      if (window.NavController && NavController.popFromNavStack) {
        NavController.popFromNavStack(function() {
          var container = document.getElementById('world-content');
          if (container && LifeGame.modules.Tasks.render) {
            LifeGame.modules.Tasks.render(container);
          }
        });
      } else {
        var container = document.getElementById('world-content') || document.getElementById('app');
        if (container) this.render(container);
      }
    },
    
    /**
     * 打开长期任务详情页
     * @param {Object} task - 长期任务
     */
    openTaskDetail: function(task) {
      var self = this;
      this.currentDetailTask = task;
      this.currentDetailTab = 'subtasks';
      
      if (window.NavController && NavController.showSubPage) {
        NavController.showSubPage(function(container) {
          self.renderDetailPageTo(container);
        });
      } else {
        this.renderDetailPage();
      }
    },
    
    /**
     * 渲染详情页到指定容器
     * @param {HTMLElement} container - 容器元素
     */
    renderDetailPageTo: function(container) {
      var self = this;
      if (!this.currentDetailTask) return;
      
      var task = this.currentDetailTask;
      var totalExp = this.calculateTaskExp(task);
      var completionRate = this.calculateCompletionRate(task);
      var completedCount = this.calculateTotalCompletedSubtasks(task);
      var lastCompleted = this.getLastCompletedDate(task);
      
      var html = '<div class="task-detail-page">' +
        '<div class="detail-header">' +
          '<button class="back-btn" id="detail-back-btn">← 返回</button>' +
          '<h2 class="detail-title">' + task.n + '</h2>' +
          '<div class="detail-header-spacer"></div>' +
        '</div>' +
        '<div class="detail-stats">' +
          '<div class="stat-item">' +
            '<span class="stat-value rank-' + (task.diff || 'f').toLowerCase() + '">' + (task.diff || 'F') + '</span>' +
            '<span class="stat-label">等级</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-value">' + totalExp + '</span>' +
            '<span class="stat-label">总经验</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-value">' + (completionRate < 1 ? completionRate.toFixed(1) : Math.round(completionRate)) + '%</span>' +
            '<span class="stat-label">完成率</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-value">' + completedCount + '</span>' +
            '<span class="stat-label">已完成</span>' +
          '</div>' +
          '<div class="stat-item">' +
            '<span class="stat-value">' + lastCompleted + '</span>' +
            '<span class="stat-label">最后完成</span>' +
          '</div>' +
        '</div>' +
        '<div class="detail-tabs">' +
          '<button class="detail-tab ' + (this.currentDetailTab === 'subtasks' ? 'active' : '') + '" data-tab="subtasks" id="subtasks-tab">子任务 <span class="tab-hint">(双击看全貌)</span></button>' +
          '<button class="detail-tab ' + (this.currentDetailTab === 'settings' ? 'active' : '') + '" data-tab="settings">设置</button>' +
        '</div>' +
        '<div class="detail-content">' +
          this.renderDetailContent(task) +
        '</div>' +
      '</div>';
      
      container.innerHTML = html;
      this.attachDetailEvents();
    },
    
    renderDetailPage: function() {
      var container = document.getElementById('world-content') || document.getElementById('app');
      if (!container) return;
      this.renderDetailPageTo(container);
    },
    
    /**
     * 计算完成率
     * @param {Object} task - 任务对象
     * @returns {number} 完成率百分比
     */
    calculateCompletionRate: function(task) {
      var totalExp = this.calculateTaskExp(task);
      var targetExp = this.expTargets[task.diff] || 1;
      return Math.min(100, (totalExp / targetExp) * 100);
    },
    
    /**
     * 计算子任务完成进度
     * @param {Object} task - 任务对象
     * @returns {Object} 进度对象 {completed, total, percent}
     */
    calculateSubtaskProgress: function(task) {
      if (!task.subtasks || task.subtasks.length === 0) {
        return { completed: 0, total: 0, percent: 0 };
      }
      
      var total = 0;
      var completed = 0;
      
      var countSubtasks = function(subtasks) {
        subtasks.forEach(function(s) {
          if (s.daily) return;
          
          total++;
          if (s.done) completed++;
          
          if (s.subtasks && s.subtasks.length > 0) {
            countSubtasks(s.subtasks);
          }
        });
      };
      
      countSubtasks(task.subtasks);
      
      var percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { completed: completed, total: total, percent: percent };
    },
    
    /**
     * 计算坚持天数
     * @param {Object} task - 任务对象
     * @returns {number} 坚持天数
     */
    calculateDaysActive: function(task) {
      return task.subtasks ? task.subtasks.filter(function(s) { return s.done; }).length : 0;
    },
    
    /**
     * 计算所有层级已完成子任务总数
     * @param {Object} task - 任务对象
     * @returns {number} 已完成子任务总数
     */
    calculateTotalCompletedSubtasks: function(task) {
      var count = 0;
      var countCompleted = function(subtasks) {
        if (!subtasks) return;
        subtasks.forEach(function(s) {
          if (s.done) count++;
          if (s.subtasks && s.subtasks.length > 0) {
            countCompleted(s.subtasks);
          }
        });
      };
      countCompleted(task.subtasks);
      return count;
    },
    
    /**
     * 获取最近完成的子任务日期
     * @param {Object} task - 任务对象
     * @returns {string} 日期字符串或 '-'
     */
    getLastCompletedDate: function(task) {
      var lastDate = null;
      var findLastDate = function(subtasks) {
        if (!subtasks) return;
        subtasks.forEach(function(s) {
          if (s.done && s.completedAt) {
            var d = new Date(s.completedAt);
            if (!lastDate || d > lastDate) {
              lastDate = d;
            }
          }
          if (s.subtasks && s.subtasks.length > 0) {
            findLastDate(s.subtasks);
          }
        });
      };
      findLastDate(task.subtasks);
      
      if (lastDate) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        var lastDateStr = lastDate.toISOString().split('T')[0];
        var todayStr = today.toISOString().split('T')[0];
        var yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDateStr === todayStr) return '今天';
        if (lastDateStr === yesterdayStr) return '昨天';
        return lastDateStr.slice(5); // 显示 MM-DD
      }
      return '-';
    },
    
    /**
     * 渲染详情内容
     * @param {Object} task - 任务对象
     * @returns {string} HTML字符串
     */
    renderDetailContent: function(task) {
      if (this.currentDetailTab === 'subtasks') {
        return this.renderSubtaskTree(task);
      } else {
        return this.renderTaskSettings(task);
      }
    },
    
    /**
     * 渲染子任务树
     * @param {Object} task - 任务对象
     * @param {string} parentId - 父任务ID
     * @param {number} level - 层级
     * @returns {string} HTML字符串
     */
    renderSubtaskTree: function(task, parentId, level) {
      var self = this;
      level = level || 0;
      parentId = parentId || null;
      
      var subtasks = [];
      if (level === 0) {
        subtasks = task.subtasks || [];
      } else {
        var parent = this.findSubtaskRecursive(task, parentId);
        subtasks = parent && parent.subtasks ? parent.subtasks : [];
      }
      
      if (subtasks.length === 0 && level === 0) {
        return '<div class="empty-subtasks">暂无子任务</div>' +
               '<button class="add-subtask-btn" id="add-root-subtask">+ 添加子任务</button>';
      }
      
      if (subtasks.length === 0) return '';
      
      subtasks = subtasks.slice().sort(function(a, b) {
        if (a.done === b.done) return 0;
        return a.done ? 1 : -1;
      });
      
      var html = '<div class="subtask-tree level-' + level + '">';
      
      var todayStr = this.getTodayStr();
      
      subtasks.forEach(function(sub) {
        var hasChildren = sub.subtasks && sub.subtasks.length > 0;
        var allChildrenDone = hasChildren && sub.subtasks.every(function(s) { return s.done; });
        var autoCollapsed = sub.done || allChildrenDone;
        
        // 优先级标记
        var priorityBadge = '';
        if (sub.priority === 'high') {
          priorityBadge = '<span class="tree-priority high" title="高优先级">🔴</span>';
        } else if (sub.priority === 'low') {
          priorityBadge = '<span class="tree-priority low" title="低优先级">🟢</span>';
        }
        
        // 日期显示和过期检查
        var dateBadge = '';
        if (sub.date) {
          var isOverdue = !sub.done && sub.date < todayStr;
          var isToday = sub.date === todayStr;
          var dateClass = isOverdue ? 'overdue' : (isToday ? 'today' : '');
          var dateText = isToday ? '今天' : sub.date.slice(5);
          dateBadge = '<span class="tree-date ' + dateClass + '">' + dateText + '</span>';
        }
        
        html += '<div class="tree-item ' + (sub.done ? 'done' : '') + '" data-sub-id="' + sub.id + '">' +
          '<div class="tree-item-content">' +
            '<div class="tree-chk ' + (sub.done ? 'done' : '') + '" data-sub-id="' + sub.id + '">' + (sub.done ? '✓' : '') + '</div>' +
            priorityBadge +
            '<span class="tree-name">' + escapeHtml(sub.n) + '</span>' +
            dateBadge +
            (sub.daily ? '<span class="tree-daily">🔥</span>' : '') +
            '<div class="tree-actions">' +
              '<button class="tree-btn add-child" data-sub-id="' + sub.id + '" title="添加子任务">+</button>' +
              '<button class="tree-btn edit-sub" data-sub-id="' + sub.id + '" title="编辑">✏️</button>' +
              '<button class="tree-btn delete-sub" data-sub-id="' + sub.id + '" title="删除">🗑️</button>' +
            '</div>' +
          '</div>';
        
        if (hasChildren) {
          html += '<div class="tree-children ' + (autoCollapsed ? 'collapsed' : '') + '" id="children-' + sub.id + '">';
          html += self.renderSubtaskTree(task, sub.id, level + 1);
          html += '</div>';
          if (level < 2) {
            html += '<button class="toggle-children" data-sub-id="' + sub.id + '">' + (autoCollapsed ? '展开 ▼' : '折叠 ▲') + '</button>';
          }
        }
        
        html += '</div>';
      });
      
      html += '</div>';
      
      if (level === 0) {
        html += '<button class="add-subtask-btn" id="add-root-subtask">+ 添加子任务</button>';
      }
      
      return html;
    },
    
    /**
     * 递归查找子任务
     * @param {Object} task - 任务对象
     * @param {string} subId - 子任务ID
     * @returns {Object|null} 子任务对象
     */
    findSubtaskRecursive: function(task, subId) {
      var self = this;
      if (!task.subtasks) return null;
      
      for (var i = 0; i < task.subtasks.length; i++) {
        var sub = task.subtasks[i];
        if (sub.id === subId) return sub;
        if (sub.subtasks) {
          var found = self.findSubtaskRecursive(sub, subId);
          if (found) return found;
        }
      }
      return null;
    },
    
    renderTaskStats: function(task) {
      return '<div class="stats-placeholder">统计功能开发中...</div>';
    },
    
    renderTaskSettings: function(task) {
      return '<div class="settings-list">' +
        '<button class="setting-btn" id="archive-task">📦 归档任务</button>' +
        '<button class="setting-btn danger" id="delete-task">🗑️ 删除任务</button>' +
      '</div>';
    },
    
    /**
     * 渲染思维导图视图
     */
    renderFullSubtaskTreeView: function() {
      var self = this;
      var container = document.getElementById('app');
      if (!container || !this.currentDetailTask) return;
      
      var task = this.currentDetailTask;
      var todayStr = this.getTodayStr();
      
      // 构建节点数据
      var nodes = [];
      var links = [];
      
      // 中心节点
      var totalExp = this.calculateTaskExp(task);
      var targetExp = this.expTargets[task.diff] || 1;
      var progress = Math.min(100, (totalExp / targetExp) * 100);
      
      nodes.push({
        id: 'root',
        name: task.n,
        level: -1,
        done: false,
        isRoot: true,
        diff: task.diff,
        progress: progress,
        completedCount: this.calculateTotalCompletedSubtasks(task),
        totalSubtasks: this.countAllSubtasks(task)
      });
      
      // 递归构建子节点
      var buildNodes = function(subtasks, parentId, level, startAngle, endAngle) {
        if (!subtasks || subtasks.length === 0) return;
        
        var angleStep = (endAngle - startAngle) / subtasks.length;
        
        subtasks.forEach(function(sub, i) {
          var angle = startAngle + angleStep * (i + 0.5);
          var isOverdue = sub.date && !sub.done && sub.date < todayStr;
          
          nodes.push({
            id: sub.id,
            name: sub.n,
            level: level,
            parentId: parentId,
            angle: angle,
            done: sub.done,
            diff: sub.diff,
            date: sub.date,
            isOverdue: isOverdue,
            daily: sub.daily,
            priority: sub.priority,
            hasChildren: sub.subtasks && sub.subtasks.length > 0,
            completedCount: sub.subtasks ? sub.subtasks.filter(function(s) { return s.done; }).length : 0,
            totalChildren: sub.subtasks ? sub.subtasks.length : 0
          });
          
          links.push({
            source: parentId,
            target: sub.id
          });
          
          if (sub.subtasks && sub.subtasks.length > 0) {
            buildNodes(sub.subtasks, sub.id, level + 1, 
              angle - angleStep * 0.4, 
              angle + angleStep * 0.4);
          }
        });
      };
      
      buildNodes(task.subtasks, 'root', 0, 0, Math.PI * 2);
      
      // 计算节点位置
      var width = Math.min(window.innerWidth, 1200);
      var height = Math.max(window.innerHeight - 100, 600);
      var centerX = width / 2;
      var centerY = height / 2;
      var maxRadius = Math.min(width, height) * 0.4;
      var levelStep = maxRadius / 3;
      
      nodes.forEach(function(node) {
        if (node.isRoot) {
          node.x = centerX;
          node.y = centerY;
        } else {
          var radius = (node.level + 1) * levelStep;
          node.x = centerX + Math.cos(node.angle) * radius;
          node.y = centerY + Math.sin(node.angle) * radius;
        }
      });
      
      // 生成SVG
      var svg = this.renderMindMapSVG(nodes, links, width, height);
      
      // 根据任务等级设置边框颜色
      var rankColorMap = {
        'sss': '#fbbf24,#ef4444,#a855f7',
        'ss': '#fbbf24,#ef4444',
        's': '#ef4444',
        'a': '#f59e0b',
        'b': '#a855f7',
        'c': '#3b82f6',
        'd': '#22c55e',
        'e': '#94a3b8',
        'f': '#ffffff'
      };
      var rankKey = (task.diff || 'f').toLowerCase();
      var borderColor = rankColorMap[rankKey] || '#38bdf8';
      var titleStyle = 'style="border-color: ' + (borderColor.includes(',') ? 'transparent' : borderColor) + '; ' +
        (borderColor.includes(',') ? 'background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9)) border-box; ' : '') +
        '"';
      
      var html = '<div class="mindmap-view">' +
        '<div class="detail-header">' +
          '<button class="back-btn" id="tree-back-btn">← 返回</button>' +
          '<h2 class="detail-title rank-border-' + rankKey + '" ' + titleStyle + '>' + task.n + ' - 思维导图</h2>' +
          '<div class="detail-header-spacer"></div>' +
        '</div>' +
        '<div class="mindmap-container">' +
          svg +
        '</div>' +
        '<div class="mindmap-legend">' +
          '<div class="legend-item"><span class="legend-dot done"></span>已完成</div>' +
          '<div class="legend-item"><span class="legend-dot overdue"></span>已过期</div>' +
          '<div class="legend-item"><span class="legend-dot normal"></span>进行中</div>' +
          '<div class="legend-item"><span class="legend-dot high-priority"></span>高优先级</div>' +
        '</div>' +
        '<div class="mindmap-hint">' +
          '💡 单击完成/取消，双击编辑' +
        '</div>' +
      '</div>';
      
      container.innerHTML = html;
      this.attachMindMapEvents(nodes, task);
    },
    
    /**
     * 计算所有子任务数量
     */
    countAllSubtasks: function(task) {
      var count = 0;
      var countSubtasks = function(subtasks) {
        if (!subtasks) return;
        subtasks.forEach(function(s) {
          count++;
          if (s.subtasks) countSubtasks(s.subtasks);
        });
      };
      countSubtasks(task.subtasks);
      return count;
    },
    
    /**
     * 渲染思维导图SVG
     */
    renderMindMapSVG: function(nodes, links, width, height) {
      var self = this;
      
      var svg = '<svg class="mindmap-svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%">' +
        '<defs>' +
          '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>' +
            '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
        '</defs>' +
        '<g class="mindmap-links">';
      
      // 绘制连线
      links.forEach(function(link) {
        var source = nodes.find(function(n) { return n.id === link.source; });
        var target = nodes.find(function(n) { return n.id === link.target; });
        if (source && target) {
          var strokeColor = target.done ? '#22c55e' : (target.isOverdue ? '#ef4444' : '#38bdf8');
          var strokeOpacity = target.done ? 0.3 : 0.6;
          svg += '<line x1="' + source.x + '" y1="' + source.y + '" x2="' + target.x + '" y2="' + target.y + '" ' +
            'stroke="' + strokeColor + '" stroke-width="' + (2 - target.level * 0.5) + '" opacity="' + strokeOpacity + '" />';
        }
      });
      
      svg += '</g><g class="mindmap-nodes">';
      
      // 绘制节点
      nodes.forEach(function(node) {
        var isRoot = node.isRoot;
        var radius = isRoot ? 50 : (30 - node.level * 5);
        var fillColor = isRoot ? '#1e293b' : (node.done ? '#166534' : (node.isOverdue ? '#7f1d1d' : '#1e3a5f'));
        var strokeColor = isRoot ? '#38bdf8' : (node.done ? '#22c55e' : (node.isOverdue ? '#ef4444' : '#38bdf8'));
        var strokeWidth = isRoot ? 3 : 2;
        
        // 优先级标记 - 使用虚线边框而不是颜色
        var priorityDash = '';
        if (node.priority === 'high' && !node.done && !node.isOverdue) {
          priorityDash = ' stroke-dasharray="4,2"';
        }
        
        // 节点圆形
        svg += '<g class="mindmap-node ' + (node.done ? 'done' : '') + (node.isOverdue ? ' overdue' : '') + '" data-node-id="' + node.id + '" ' +
          'transform="translate(' + node.x + ',' + node.y + ')">' +
          '<circle r="' + radius + '" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '"' + priorityDash +
          (isRoot ? ' filter="url(#glow)"' : '') + ' />';
        
        // 根节点显示进度环
        if (isRoot && node.progress > 0) {
          var circumference = 2 * Math.PI * (radius + 8);
          var offset = circumference - (node.progress / 100) * circumference;
          svg += '<circle r="' + (radius + 8) + '" fill="none" stroke="#22c55e" stroke-width="4" ' +
            'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" ' +
            'transform="rotate(-90)" opacity="0.8" />';
        }
        
        // 节点文字
        var fontSize = isRoot ? 14 : (12 - node.level);
        var maxChars = isRoot ? 8 : 6;
        var displayName = node.name.length > maxChars ? node.name.substring(0, maxChars) + '..' : node.name;
        
        svg += '<text y="' + (isRoot ? 5 : 4) + '" text-anchor="middle" fill="#fff" font-size="' + fontSize + '" ' +
          'font-weight="' + (isRoot ? '600' : '400') + '">' + displayName + '</text>';
        
        // 根节点显示进度文字
        if (isRoot) {
          svg += '<text y="25" text-anchor="middle" fill="#94a3b8" font-size="10">' +
            node.completedCount + '/' + node.totalSubtasks + '</text>';
        }
        
        // 完成标记
        if (node.done && !isRoot) {
          svg += '<text y="-2" text-anchor="middle" fill="#22c55e" font-size="14">✓</text>';
        }
        
        // 过期标记
        if (node.isOverdue && !node.done) {
          svg += '<circle r="4" cx="' + (radius - 6) + '" cy="' + (-radius + 6) + '" fill="#ef4444" />';
        }
        
        // 有子任务的标记
        if (node.hasChildren && !isRoot) {
          svg += '<circle r="3" cx="' + (radius - 4) + '" cy="' + (radius - 4) + '" fill="#38bdf8" />';
        }
        
        svg += '</g>';
      });
      
      svg += '</g></svg>';
      return svg;
    },
    
    /**
     * 绑定思维导图事件
     */
    attachMindMapEvents: function(nodes, task) {
      var self = this;
      
      // 返回按钮 - 使用 NavController 返回到详情页
      var backBtn = document.getElementById('tree-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          // 确保 currentDetailTask 存在
          self.currentDetailTask = task;
          self.currentDetailTab = 'subtasks';
          if (window.NavController && NavController.popFromNavStack) {
            NavController.popFromNavStack(function() {
              self.renderDetailPage();
            });
          } else {
            self.renderDetailPage();
          }
        });
      }
      
      // 节点点击事件（完成/取消完成）- 使用双击检测避免冲突
      document.querySelectorAll('.mindmap-node').forEach(function(nodeEl) {
        var nodeId = nodeEl.dataset.nodeId;
        if (nodeId === 'root') return; // 根节点不处理
        
        var node = nodes.find(function(n) { return n.id === nodeId; });
        if (!node) return;
        
        var clickTimer = null;
        var clickCount = 0;
        
        nodeEl.addEventListener('click', function(e) {
          e.stopPropagation();
          clickCount++;
          
          if (clickCount === 1) {
            // 延迟执行单击操作
            clickTimer = setTimeout(function() {
              if (clickCount === 1) {
                // 确实是单击
                var sub = self.findSubtaskRecursive(task, nodeId);
                if (!sub) return;
                
                if (sub.done) {
                  // 取消完成 - 直接执行
                  sub.done = false;
                  delete sub.completedAt;
                  LifeGame.core.Storage.set('tasks', self.data);
                  self.renderFullSubtaskTreeView();
                } else {
                  // 完成 - 显示确认
                  self.showCompleteConfirm(sub, function() {
                    sub.done = true;
                    sub.completedAt = new Date().toISOString();
                    LifeGame.core.Storage.set('tasks', self.data);
                    
                    // 发放经验
                    var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
                    var exp = expMap[sub.diff] || 5;
                    LifeGame.emit('exp:gained', { amount: exp, source: 'subtask', taskId: task.id, subId: sub.id });
                    
                    self.renderFullSubtaskTreeView();
                  });
                }
              }
              clickCount = 0;
            }, 250);
          }
        });
        
        // 双击 - 编辑（取消单击操作）
        nodeEl.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          // 取消单击定时器
          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
          }
          clickCount = 0;
          // 执行双击操作
          self.openEditSubtaskForm(nodeId);
        });
      });
    },
    
    /**
     * 显示完成确认弹窗
     */
    showCompleteConfirm: function(sub, onConfirm) {
      var self = this;
      var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
      var exp = expMap[sub.diff] || 5;
      
      // 创建遮罩和弹窗
      var overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = 
        '<div class="confirm-dialog">' +
          '<h4>完成任务</h4>' +
          '<p>确定完成 "' + escapeHtml(sub.n) + '" 吗？</p>' +
          '<div class="confirm-reward">+' + exp + ' EXP</div>' +
          '<div class="confirm-actions">' +
            '<button class="confirm-cancel">取消</button>' +
            '<button class="confirm-ok">确定</button>' +
          '</div>' +
        '</div>';
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('.confirm-cancel').addEventListener('click', function() {
        document.body.removeChild(overlay);
      });
      
      overlay.querySelector('.confirm-ok').addEventListener('click', function() {
        document.body.removeChild(overlay);
        onConfirm();
      });
      
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });
    },
    
    /**
     * 递归渲染完整树
     * @param {Object} task - 任务对象
     * @param {Array} subtasks - 子任务数组
     * @param {number} level - 层级
     * @returns {string} HTML字符串
     */
    renderFullTreeRecursive: function(task, subtasks, level) {
      var self = this;
      if (!subtasks || subtasks.length === 0) return '';
      
      var sorted = subtasks.slice().sort(function(a, b) {
        if (a.done === b.done) return 0;
        return a.done ? 1 : -1;
      });
      
      var levelNames = ['', '子任务', '子子任务'];
      var levelName = levelNames[level] || '任务';
      
      var html = '<div class="full-tree-level level-' + level + '">';
      
      if (level > 0) {
        html += '<div class="tree-level-header" style="padding-left:' + ((level - 1) * 24) + 'px">' +
          '<span class="level-badge level-' + level + '">' + levelName + '</span>' +
        '</div>';
      }
      
      sorted.forEach(function(sub) {
        var hasChildren = sub.subtasks && sub.subtasks.length > 0;
        var diffClass = 'diff-' + (sub.diff || 'f').toLowerCase();
        var nodeTypeClass = level === 0 ? 'node-root' : (level === 1 ? 'node-child' : 'node-grandchild');
        var isCollapsed = sub.collapsed ? 'collapsed' : '';
        
        html += '<div class="full-tree-node ' + nodeTypeClass + ' ' + (sub.done ? 'done' : '') + '" data-sub-id="' + sub.id + '">' +
          '<div class="tree-node-content" style="padding-left:' + (level * 24) + 'px">' +
            '<div class="tree-branch-icon level-' + level + '"></div>' +
            '<div class="tree-node-chk ' + (sub.done ? 'done' : '') + '">' + (sub.done ? '✓' : '') + '</div>' +
            '<span class="tree-node-rank ' + diffClass + '">' + (sub.diff || 'F') + '</span>' +
            '<span class="tree-node-name">' + escapeHtml(sub.n) + '</span>' +
            (sub.daily ? '<span class="tree-node-daily">🔥</span>' : '') +
            (sub.date ? '<span class="tree-node-date">' + sub.date + '</span>' : '') +
            (hasChildren ? '<button class="tree-node-toggle" data-sub-id="' + sub.id + '">' + (sub.collapsed ? '▶' : '▼') + '</button>' : '') +
          '</div>' +
        '</div>';
        
        if (hasChildren) {
          html += '<div class="tree-children-container ' + isCollapsed + '" id="children-' + sub.id + '">' +
            self.renderFullTreeRecursive(task, sub.subtasks, level + 1) +
          '</div>';
        }
      });
      
      html += '</div>';
      return html;
    },
    
    /**
     * 完整树状图事件绑定
     */
    attachFullTreeEvents: function() {
      var self = this;
      
      var treeBackBtn = document.getElementById('tree-back-btn');
      if (treeBackBtn) {
        treeBackBtn.addEventListener('click', function() {
          LifeGame.emit('nav:back');
        });
      }
      
      document.querySelectorAll('.tree-node-chk').forEach(function(chk) {
        chk.addEventListener('click', function(e) {
          e.stopPropagation();
          var subId = this.closest('.full-tree-node').dataset.subId;
          self.toggleSubtaskInDetail(subId);
          self.renderFullSubtaskTreeView();
        });
      });
      
      // 子任务名称编辑：桌面端双击，移动端长按
      document.querySelectorAll('.tree-node-name').forEach(function(nameEl) {
        if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
          // 移动端：长按编辑
          MobileUtils.addLongPressListener(nameEl, function(e) {
            var subId = nameEl.closest('.full-tree-node').dataset.subId;
            self.openEditSubtaskForm(subId);
          }, 500);
        } else {
          // 桌面端：双击编辑
          nameEl.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            var subId = this.closest('.full-tree-node').dataset.subId;
            self.openEditSubtaskForm(subId);
          });
        }
      });
      
      document.querySelectorAll('.tree-node-toggle').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var subId = this.dataset.subId;
          self.toggleSubtaskCollapse(subId);
        });
      });
      
      document.querySelectorAll('.tree-node-add').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var parentId = this.dataset.parent;
          self.openAddSubtaskForm(parentId);
        });
      });
    },
    
    /**
     * 切换子任务折叠状态
     * @param {string} subId - 子任务ID
     */
    toggleSubtaskCollapse: function(subId) {
      var task = this.currentDetailTask;
      var sub = this.findSubtaskRecursive(task, subId);
      if (!sub) return;
      
      sub.collapsed = !sub.collapsed;
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      this.renderFullSubtaskTreeView();
    },
    
    /**
     * 详情页事件绑定
     */
    attachDetailEvents: function() {
      var self = this;
      var detailContainer = document.querySelector('.task-detail-page');
      if (!detailContainer) return;
      
      var detailBackBtn = detailContainer.querySelector('#detail-back-btn');
      if (detailBackBtn) {
        detailBackBtn.addEventListener('click', function() {
          self.currentDetailTask = null;
          // 直接返回长期任务列表
          var container = document.getElementById('world-content') || document.getElementById('app');
          if (container) {
            self.render(container);
          }
        });
      }
      
      var detailTabs = detailContainer.querySelector('.detail-tabs');
      if (detailTabs) {
        detailTabs.addEventListener('click', function(e) {
          var tab = e.target.closest('.detail-tab');
          if (tab) {
            self.currentDetailTab = tab.dataset.tab;
            self.renderDetailPage();
          }
        });
      }
      
      var subtasksTab = detailContainer.querySelector('#subtasks-tab');
      if (subtasksTab) {
        // 双击（桌面端）或长按（移动端）进入子任务全貌
        if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
          MobileUtils.addLongPressListener(subtasksTab, function() {
            self.renderFullSubtaskTreeView();
          }, 600);
        } else {
          subtasksTab.addEventListener('dblclick', function() {
            self.renderFullSubtaskTreeView();
          });
        }
      }
      
      var detailContent = detailContainer.querySelector('.detail-content');
      if (detailContent) {
        detailContent.addEventListener('click', function(e) {
          var chk = e.target.closest('.tree-chk');
          if (chk) {
            var subId = chk.dataset.subId;
            self.toggleSubtaskInDetail(subId);
            return;
          }
          
          var addChildBtn = e.target.closest('.add-child');
          if (addChildBtn) {
            var subId = addChildBtn.dataset.subId;
            self.openAddSubtaskForm(subId);
            return;
          }
          
          var editBtn = e.target.closest('.edit-sub');
          if (editBtn) {
            var subId = editBtn.dataset.subId;
            self.openEditSubtaskForm(subId);
            return;
          }
          
          var deleteBtn = e.target.closest('.delete-sub');
          if (deleteBtn) {
            var subId = deleteBtn.dataset.subId;
            self.deleteSubtask(subId);
            return;
          }
          
          var toggleBtn = e.target.closest('.toggle-children');
          if (toggleBtn) {
            var subId = toggleBtn.dataset.subId;
            var childrenEl = detailContent.querySelector('#children-' + subId);
            if (childrenEl) {
              var isCollapsed = childrenEl.classList.contains('collapsed');
              childrenEl.classList.toggle('collapsed');
              toggleBtn.textContent = isCollapsed ? '折叠 ▲' : '展开 ▼';
            }
            return;
          }
          
          var treeName = e.target.closest('.tree-name');
          if (treeName) {
            e.stopPropagation();
            var treeItem = treeName.closest('.tree-item');
            if (treeItem) {
              var subId = treeItem.dataset.subId;
              self.openSubtaskDetail(subId);
            }
            return;
          }
        });
      }
      
      var addRootBtn = detailContainer.querySelector('#add-root-subtask');
      if (addRootBtn) {
        addRootBtn.addEventListener('click', function() {
          self.openAddSubtaskForm(null);
        });
      }
    },
    
    /**
     * 在详情页切换子任务完成状态
     * @param {string} subId - 子任务ID
     */
    toggleSubtaskInDetail: function(subId) {
      var self = this;
      var task = this.currentDetailTask;
      var toggledSub = null;
      
      var toggleSub = function(subtasks) {
        for (var i = 0; i < subtasks.length; i++) {
          if (subtasks[i].id === subId) {
            subtasks[i].done = !subtasks[i].done;
            // 记录或清除完成时间
            if (subtasks[i].done) {
              subtasks[i].completedAt = new Date().toISOString();
            } else {
              delete subtasks[i].completedAt;
            }
            toggledSub = subtasks[i];
            return true;
          }
          if (subtasks[i].subtasks) {
            if (toggleSub(subtasks[i].subtasks)) return true;
          }
        }
        return false;
      };
      
      toggleSub(task.subtasks || []);
      
      if (toggledSub && !toggledSub.daily) {
        var expMap = { 'SSS': 10000000, 'SS': 1000000, 'S': 100000, 'A': 10000, 'B': 1000, 'C': 100, 'D': 10, 'E': 5, 'F': 1 };
        var expChange = expMap[toggledSub.diff] || expMap[task.diff] || 1;
        
        if (toggledSub.done) {
          var profile = LifeGame.core.Storage.get('profile') || {};
          profile.exp = (profile.exp || 0) + expChange;
          LifeGame.core.Storage.set('profile', profile);
          LifeGame.emit('user:exp:gained', { exp: expChange, total: profile.exp });
          
          if (task.period === 'long' || task.period === 'longterm') {
            task.totalExp = (task.totalExp || 0) + expChange;
            LifeGame.emit('task:exp:gained', { task: task, exp: expChange, total: task.totalExp });
          }
          
          // 触发子任务完成事件
          LifeGame.emit('task:completed', {
            task: toggledSub,
            name: toggledSub.n || '子任务',
            subtaskName: toggledSub.n || '子任务',
            parentName: task.n || '长期任务',
            taskName: task.n || '长期任务',
            isLongTask: task.period === 'long' || task.period === 'longterm',
            isSubtask: true,
            parentId: task.id,
            expChange: expChange
          });
        } else {
          var profile = LifeGame.core.Storage.get('profile') || {};
          profile.exp = Math.max(0, (profile.exp || 0) - expChange);
          LifeGame.core.Storage.set('profile', profile);
          LifeGame.emit('user:exp:lost', { exp: expChange, total: profile.exp });
          
          if (task.period === 'long' || task.period === 'longterm') {
            task.totalExp = Math.max(0, (task.totalExp || 0) - expChange);
            LifeGame.emit('task:exp:lost', { task: task, exp: expChange, total: task.totalExp });
          }
        }
      }
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      if (this.currentSubtaskId) {
        this.renderSubtaskDetailPage();
      } else if (document.querySelector('.full-tree-view')) {
        this.renderFullSubtaskTreeView();
      } else {
        this.renderDetailPage();
      }
    },
    
    /**
     * 打开添加子任务表单
     * @param {string} parentSubId - 父级子任务ID
     */
    openAddSubtaskForm: function(parentSubId) {
      var task = this.currentDetailTask;
      var parentDiff = task.diff || 'F';
      
      if (parentSubId) {
        var parentSub = this.findSubtaskRecursive(task, parentSubId);
        if (parentSub) {
          parentDiff = parentSub.diff || parentDiff;
        }
      }
      
      var returnToFullTree = !!document.querySelector('.full-tree-view');
      this.renderSubtaskForm(null, parentSubId, parentDiff, returnToFullTree);
    },
    
    /**
     * 打开编辑子任务表单
     * @param {string} subId - 子任务ID
     */
    openEditSubtaskForm: function(subId) {
      var task = this.currentDetailTask;
      var sub = this.findSubtaskRecursive(task, subId);
      
      var parentDiff = task.diff || 'F';
      var findParentDiff = function(subtasks, targetId, currentParentDiff) {
        for (var i = 0; i < subtasks.length; i++) {
          if (subtasks[i].id === targetId) {
            return currentParentDiff;
          }
          if (subtasks[i].subtasks) {
            var found = findParentDiff(subtasks[i].subtasks, targetId, subtasks[i].diff || currentParentDiff);
            if (found) return found;
          }
        }
        return null;
      };
      
      var foundParentDiff = findParentDiff(task.subtasks || [], subId, parentDiff);
      if (foundParentDiff) parentDiff = foundParentDiff;
      
      var returnToFullTree = !!document.querySelector('.full-tree-view');
      this.renderSubtaskForm(sub, null, parentDiff, returnToFullTree);
    },
    
    /**
     * 渲染子任务表单
     * @param {Object} sub - 子任务对象
     * @param {string} parentSubId - 父级子任务ID
     * @param {string} parentDiff - 父级难度
     * @param {boolean} returnToFullTree - 是否返回到完整树视图
     */
    renderSubtaskForm: function(sub, parentSubId, parentDiff, returnToFullTree) {
      var self = this;
      var isEdit = !!sub;
      
      // 尝试找到合适的容器（详情页或思维导图页）
      var container = document.querySelector('.detail-content');
      if (!container) {
        // 如果在思维导图页面，渲染到 mindmap-container
        var mindmapContainer = document.querySelector('.mindmap-container');
        if (mindmapContainer) {
          // 清空并创建表单容器
          mindmapContainer.innerHTML = '<div class="subtask-form-container" style="max-width: 400px; margin: 0 auto; padding: 20px;"></div>';
          container = mindmapContainer.querySelector('.subtask-form-container');
        }
      }
      if (!container) return;
      
      parentDiff = parentDiff || 'F';
      var name = isEdit ? sub.n : '';
      var diff = isEdit ? (sub.diff || 'F') : 'F';
      var date = isEdit ? (sub.date || '') : '';
      var isDaily = isEdit ? sub.daily : false;
      var priority = isEdit ? (sub.priority || 'normal') : 'normal';
      
      var diffOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
      var parentIndex = diffOrder.indexOf(parentDiff);
      
      var allowedDiffs = diffOrder.slice(0, parentIndex + 1);
      
      var diffOptions = allowedDiffs.map(function(d) {
        return '<option value="' + d + '" ' + (diff === d ? 'selected' : '') + '>' + d + '</option>';
      }).join('');
      
      var limitHint = '<div class="diff-limit-hint">⚠️ 子任务难度不得高于上级（' + parentDiff + '）</div>';
      
      container.innerHTML = 
        '<div class="subtask-form">' +
          '<h4>' + (isEdit ? '编辑子任务' : '添加子任务') + '</h4>' +
          limitHint +
          '<div class="form-group">' +
            '<label>名称</label>' +
            '<input type="text" id="sub-name" value="' + name + '" placeholder="子任务名称">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>难度</label>' +
            '<select id="sub-diff">' + diffOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>优先级</label>' +
            '<select id="sub-priority">' +
              '<option value="low" ' + (priority === 'low' ? 'selected' : '') + '>🟢 低</option>' +
              '<option value="normal" ' + (priority === 'normal' ? 'selected' : '') + '>🟡 中</option>' +
              '<option value="high" ' + (priority === 'high' ? 'selected' : '') + '>🔴 高</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>计划日期</label>' +
            '<input type="date" id="sub-date" value="' + date + '">' +
            '<div class="quick-date-btns">' +
              '<button type="button" class="quick-date-btn" data-offset="0">今天</button>' +
              '<button type="button" class="quick-date-btn" data-offset="1">明天</button>' +
              '<button type="button" class="quick-date-btn" data-offset="2">后天</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group checkbox">' +
            '<label><input type="checkbox" id="sub-daily" ' + (isDaily ? 'checked' : '') + '> 设为每日挑战</label>' +
          '</div>' +
          '<div class="form-actions">' +
            (isEdit ? '<button class="delete-btn" id="delete-sub">🗑️ 删除</button>' : '') +
            '<button class="cancel-btn" id="cancel-sub">取消</button>' +
            '<button class="save-btn" id="save-sub">保存</button>' +
          '</div>' +
          (isEdit ? '<div class="form-actions secondary-actions"><button class="add-child-btn" id="add-child-sub">➕ 添加下级子任务</button></div>' : '') +
        '</div>';
      
      var cancelSub = document.getElementById('cancel-sub');
      if (cancelSub) {
        cancelSub.addEventListener('click', function() {
          if (returnToFullTree) {
            self.renderFullSubtaskTreeView();
          } else if (self.currentSubtaskId) {
            self.renderSubtaskDetailPage();
          } else {
            self.renderDetailPage();
          }
        });
      }
      
      document.querySelectorAll('.quick-date-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var offset = parseInt(this.dataset.offset);
          var dateInput = document.getElementById('sub-date');
          dateInput.value = self.getDateStr(offset);
        });
      });
      
      var saveSub = document.getElementById('save-sub');
      if (saveSub) {
        saveSub.addEventListener('click', function() {
          self.saveSubtask(sub, parentSubId, returnToFullTree);
        });
      }
      
      // 删除按钮事件（编辑模式）
      var deleteSub = document.getElementById('delete-sub');
      if (deleteSub && isEdit) {
        deleteSub.addEventListener('click', function() {
          if (confirm('确定要删除这个子任务吗？')) {
            self.deleteSubtask(sub.id);
            if (returnToFullTree) {
              self.renderFullSubtaskTreeView();
            } else if (self.currentSubtaskId) {
              self.renderSubtaskDetailPage();
            } else {
              self.renderDetailPage();
            }
          }
        });
      }
      
      // 添加下级子任务按钮事件（编辑模式）
      var addChildSub = document.getElementById('add-child-sub');
      if (addChildSub && isEdit) {
        addChildSub.addEventListener('click', function() {
          // 先保存当前子任务，然后打开添加子任务表单
          self.saveSubtask(sub, parentSubId, returnToFullTree);
          // 为当前子任务添加子任务
          self.openAddSubtaskForm(sub.id);
        });
      }
    },
    
    /**
     * 保存子任务
     * @param {Object} existingSub - 现有子任务对象
     * @param {string} parentSubId - 父级子任务ID
     * @param {boolean} returnToFullTree - 是否返回到完整树视图
     */
    saveSubtask: function(existingSub, parentSubId, returnToFullTree) {
      var nameEl = document.getElementById('sub-name');
      var diffEl = document.getElementById('sub-diff');
      var priorityEl = document.getElementById('sub-priority');
      var dateEl = document.getElementById('sub-date');
      var dailyEl = document.getElementById('sub-daily');
      
      if (!nameEl || !diffEl || !dateEl || !dailyEl) {
        LifeGame.error('[tasks] 保存子任务失败：表单元素不存在');
        return;
      }
      
      var name = nameEl.value.trim();
      var diff = diffEl.value;
      var priority = priorityEl ? priorityEl.value : 'normal';
      var date = dateEl.value;
      var isDaily = dailyEl.checked;
      
      if (!name) {
        alert('请输入子任务名称');
        return;
      }
      
      var task = this.currentDetailTask;
      var newSub = {
        id: existingSub ? existingSub.id : ('s' + Date.now()),
        n: name,
        diff: diff,
        priority: priority,
        done: existingSub ? existingSub.done : false,
        date: date || undefined,
        daily: isDaily,
        subtasks: existingSub ? (existingSub.subtasks || []) : []
      };
      
      if (existingSub) {
        this.updateSubtaskRecursive(task, newSub);
      } else {
        if (parentSubId) {
          var parent = this.findSubtaskRecursive(task, parentSubId);
          if (parent) {
            if (!parent.subtasks) parent.subtasks = [];
            parent.subtasks.push(newSub);
          }
        } else {
          if (!task.subtasks) task.subtasks = [];
          task.subtasks.push(newSub);
        }
      }
      
      LifeGame.core.Storage.set('tasks', this.data);
      
      if (returnToFullTree) {
        this.renderFullSubtaskTreeView();
      } else if (this.currentSubtaskId) {
        this.renderSubtaskDetailPage();
      } else {
        this.renderDetailPage();
      }
    },
    
    /**
     * 递归更新子任务
     * @param {Object} task - 任务对象
     * @param {Object} updatedSub - 更新后的子任务
     */
    updateSubtaskRecursive: function(task, updatedSub) {
      var updateIn = function(subtasks) {
        for (var i = 0; i < subtasks.length; i++) {
          if (subtasks[i].id === updatedSub.id) {
            subtasks[i] = updatedSub;
            return true;
          }
          if (subtasks[i].subtasks) {
            if (updateIn(subtasks[i].subtasks)) return true;
          }
        }
        return false;
      };
      updateIn(task.subtasks || []);
    },
    
    /**
     * 删除子任务
     * @param {string} subId - 子任务ID
     */
    deleteSubtask: function(subId) {
      if (!confirm('确定要删除这个子任务吗？')) return;
      
      var task = this.currentDetailTask;
      var deleteFrom = function(subtasks) {
        for (var i = 0; i < subtasks.length; i++) {
          if (subtasks[i].id === subId) {
            subtasks.splice(i, 1);
            return true;
          }
          if (subtasks[i].subtasks) {
            if (deleteFrom(subtasks[i].subtasks)) return true;
          }
        }
        return false;
      };
      
      deleteFrom(task.subtasks || []);
      LifeGame.core.Storage.set('tasks', this.data);
      this.renderDetailPage();
    },
    
    /**
     * 打开子任务详情页
     * @param {string} subId - 子任务ID
     */
    openSubtaskDetail: function(subId) {
      this.currentSubtaskId = subId;
      this.renderSubtaskDetailPage();
    },
    
    /**
     * 渲染子任务详情页
     */
    renderSubtaskDetailPage: function() {
      var self = this;
      var container = document.getElementById('app');
      if (!container || !this.currentDetailTask || !this.currentSubtaskId) return;
      
      var task = this.currentDetailTask;
      var targetSub = this.findSubtaskRecursive(task, this.currentSubtaskId);
      if (!targetSub) return;
      
      var path = this.getSubtaskPath(task, this.currentSubtaskId);
      
      var html = '<div class="subtask-detail-page">' +
        '<div class="detail-header">' +
          '<button class="back-btn" id="subtask-back-btn">← 返回</button>' +
          '<h2>子任务详情</h2>' +
        '</div>' +
        '<div class="path-breadcrumb">' +
          '<span class="path-root">' + task.n + '</span>' +
          path.map(function(p) {
            return '<span class="path-separator">→</span><span class="path-item ' + (p.id === self.currentSubtaskId ? 'current' : '') + '">' + p.n + '</span>';
          }).join('') +
        '</div>' +
        '<div class="current-subtask-card">' +
          '<div class="subtask-header">' +
            '<span class="subtask-rank rank-' + (targetSub.diff || 'f').toLowerCase() + '">' + (targetSub.diff || 'F') + '</span>' +
            '<h3>' + targetSub.n + '</h3>' +
            (targetSub.daily ? '<span class="daily-badge">🔥 每日挑战</span>' : '') +
          '</div>' +
          (targetSub.date ? '<div class="subtask-date">计划日期: ' + targetSub.date + '</div>' : '') +
          '<div class="subtask-status">' +
            '<span class="status-chk ' + (targetSub.done ? 'done' : '') + '" id="current-sub-chk">' + (targetSub.done ? '✓ 已完成' : '☐ 未完成') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="children-section">' +
          '<h4>下级子任务</h4>' +
          this.renderSubtaskChildren(targetSub) +
        '</div>' +
        '<div class="subtask-actions">' +
          '<button class="action-btn" id="edit-current-sub">✏️ 编辑</button>' +
          '<button class="action-btn" id="add-child-to-current">+ 添加下级</button>' +
          '<button class="action-btn danger" id="delete-current-sub">🗑️ 删除</button>' +
        '</div>' +
      '</div>';
      
      container.innerHTML = html;
      this.attachSubtaskDetailEvents(targetSub);
    },
    
    /**
     * 获取子任务路径
     * @param {Object} task - 任务对象
     * @param {string} targetId - 目标子任务ID
     * @returns {Array} 路径数组
     */
    getSubtaskPath: function(task, targetId) {
      var path = [];
      
      var findPath = function(subtasks, targetId, currentPath) {
        for (var i = 0; i < subtasks.length; i++) {
          var newPath = currentPath.concat([subtasks[i]]);
          if (subtasks[i].id === targetId) {
            path = newPath;
            return true;
          }
          if (subtasks[i].subtasks) {
            if (findPath(subtasks[i].subtasks, targetId, newPath)) return true;
          }
        }
        return false;
      };
      
      findPath(task.subtasks || [], targetId, []);
      return path;
    },
    
    /**
     * 渲染子任务的下级
     * @param {Object} sub - 子任务对象
     * @returns {string} HTML字符串
     */
    renderSubtaskChildren: function(sub) {
      if (!sub.subtasks || sub.subtasks.length === 0) {
        return '<div class="no-children">暂无下级子任务</div>';
      }
      
      var sortedSubtasks = sub.subtasks.slice().sort(function(a, b) {
        if (a.done === b.done) return 0;
        return a.done ? 1 : -1;
      });
      
      var html = '<div class="children-list">';
      sortedSubtasks.forEach(function(child) {
        html += '<div class="child-item ' + (child.done ? 'done' : '') + '">' +
          '<span class="child-rank rank-' + (child.diff || 'f').toLowerCase() + '">' + (child.diff || 'F') + '</span>' +
          '<span class="child-name">' + child.n + '</span>' +
          (child.done ? '<span class="child-done">✓</span>' : '') +
        '</div>';
      });
      html += '</div>';
      return html;
    },
    
    /**
     * 子任务详情页事件绑定
     * @param {Object} sub - 子任务对象
     */
    attachSubtaskDetailEvents: function(sub) {
      var self = this;
      
      document.getElementById('subtask-back-btn').addEventListener('click', function() {
        self.currentSubtaskId = null;
        self.renderDetailPage();
      });
      
      document.getElementById('current-sub-chk').addEventListener('click', function() {
        self.toggleSubtaskInDetail(self.currentSubtaskId);
        self.renderSubtaskDetailPage();
      });
      
      document.getElementById('edit-current-sub').addEventListener('click', function() {
        self.openEditSubtaskForm(self.currentSubtaskId);
      });
      
      document.getElementById('add-child-to-current').addEventListener('click', function() {
        self.openAddSubtaskForm(self.currentSubtaskId);
      });
      
      document.getElementById('delete-current-sub').addEventListener('click', function() {
        self.deleteSubtask(self.currentSubtaskId);
        self.currentSubtaskId = null;
      });
    },
    
    /**
     * 保存新任务
     */
    saveNewTask: function() {
      var name = document.getElementById('task-name').value.trim();
      var type = document.getElementById('task-type').value;
      var diff = document.getElementById('task-diff').value;
      var sub = document.getElementById('task-sub').value.trim();
      var dateInput = document.getElementById('task-date');
      var targetDate = dateInput ? dateInput.value : '';
      
      if (!name) {
        alert('请输入任务名称');
        return;
      }
      
      var allowedDiffs;
      if (this.currentFilter === 'today' || this.currentFilter === 'inbox') {
        allowedDiffs = ['F', 'E', 'D', 'C'];
        if (allowedDiffs.indexOf(diff) === -1) {
          alert('今日/收集箱任务最高只能创建C级！');
          return;
        }
      } else if (this.currentFilter === 'long') {
        allowedDiffs = ['C', 'B', 'A'];
        if (allowedDiffs.indexOf(diff) === -1) {
          alert('长期任务只能创建C/B/A级，S级以上需通过升级获得！');
          return;
        }
      }
      
      // 显示保存中状态
      var loadingId = null;
      if (LifeGame.showLoading) {
        loadingId = LifeGame.showLoading('保存中...', { blocking: false });
      }
      
      var period = this.currentFilter === 'today' ? 'today' : (this.currentFilter === 'inbox' ? 'inbox' : 'long');
      
      var newTask = {
        id: 't' + Date.now(),
        n: name,
        type: type,
        diff: diff,
        grade: diff,
        sub: sub || undefined,
        period: period,
        done: false,
        subtasks: [],
        currentExp: 0
      };
      
      if (targetDate) {
        newTask.targetDate = targetDate;
      }
      
      this.data.push(newTask);
      LifeGame.core.Storage.set('tasks', this.data);
      LifeGame.emit('task:created', { task: newTask });
      
      // 隐藏加载状态并显示成功
      if (LifeGame.hideLoading && loadingId) {
        LifeGame.hideLoading(loadingId);
      }
      if (LifeGame.showSuccess) {
        LifeGame.showSuccess('✅ 任务创建成功！');
      }
      
      // 根据当前过滤器决定返回行为
      if (this.currentFilter === 'inbox') {
        // 收集箱任务添加后，返回收集箱列表
        this.debouncedRender();
      } else {
        // 其他情况使用导航返回
        LifeGame.emit('nav:back');
      }
    },
    
    tooltipEl: null,
    tooltipHideTimer: null,
    
    /**
     * 显示任务悬浮提示
     * @param {Object} task - 任务对象
     * @param {HTMLElement} targetEl - 目标元素
     */
    showTaskTooltip: function(task, targetEl) {
      this.hideTaskTooltip();
      
      var tooltip = document.createElement('div');
      tooltip.className = 'task-tooltip';
      
      var parentName = '';
      if (task.parentTask) {
        parentName = '<div class="tooltip-parent">来自: ' + escapeHtml(task.parentTask.n) + '</div>';
      }
      
      var diffLabel = task.diff || 'F';
      var diffClass = 'diff-' + diffLabel.toLowerCase();
      
      var dateInfo = '';
      if (task.date) {
        dateInfo = '<div class="tooltip-date">📅 ' + task.date + '</div>';
      }
      
      tooltip.innerHTML = 
        '<div class="tooltip-content">' +
          '<div class="tooltip-header">' +
            '<span class="tooltip-diff ' + diffClass + '">' + diffLabel + '</span>' +
            '<span class="tooltip-name">' + escapeHtml(task.n) + '</span>' +
          '</div>' +
          parentName +
          (task.sub ? '<div class="tooltip-sub">' + escapeHtml(task.sub) + '</div>' : '') +
          dateInfo +
        '</div>';
      
      document.body.appendChild(tooltip);
      this.tooltipEl = tooltip;
      
      var rect = targetEl.getBoundingClientRect();
      var tooltipRect = tooltip.getBoundingClientRect();
      
      var left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      var top = rect.bottom + 8;
      
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 8;
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.opacity = '1';
      
      // 移动端：点击外部关闭 tooltip
      if (MobileUtils && MobileUtils.isTouchDevice && MobileUtils.isTouchDevice()) {
        var self = this;
        var closeHandler = function(e) {
          if (!tooltip.contains(e.target)) {
            self.hideTaskTooltip();
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('touchstart', closeHandler);
          }
        };
        // 延迟绑定，避免立即触发
        setTimeout(function() {
          document.addEventListener('click', closeHandler);
          document.addEventListener('touchstart', closeHandler);
        }, 10);
      }
    },
    
    /**
     * 隐藏任务悬浮提示
     */
    hideTaskTooltip: function() {
      if (this.tooltipEl) {
        if (this.tooltipEl.parentNode) {
          this.tooltipEl.parentNode.removeChild(this.tooltipEl);
        }
        this.tooltipEl = null;
      }
      if (this.tooltipHideTimer) {
        clearTimeout(this.tooltipHideTimer);
        this.tooltipHideTimer = null;
      }
    },
    
    /**
     * 处理卡片双击事件（桌面端）
     * @param {Event} e - 双击事件
     */
    handleCardDoubleClick: function(e) {
      var self = this;
      var card = e.target.closest('.long-task-card[data-task-id]');
      if (card) {
        if (e.target.closest('.task-btn') || e.target.closest('.subtask-chk') || 
            e.target.closest('.toggle-subtasks') || e.target.closest('.grade-complete-btn') || 
            e.target.closest('.long-card-complete-btn') || e.target.closest('.inbox-btn-card') ||
            e.target.closest('.task-chk-square')) return;
        var taskId = card.dataset.taskId;
        var task = this.data.find(function(t) { return t.id === taskId; });
        if (task) {
          // 今日任务和收集箱双击进入编辑，长期任务双击进入详情
          if (task.period === 'today' || task.period === 'inbox') {
            this.editTask(taskId);
          } else if (task.period === 'long' || task.period === 'longterm') {
            this.openTaskDetail(task);
          }
        }
        return;
      }
      
      var subtaskRow = e.target.closest('.subtask-row');
      if (subtaskRow) {
        if (e.target.closest('.subtask-chk')) return;
        var taskId = subtaskRow.dataset.task;
        var subId = subtaskRow.dataset.sub;
        var task = this.data.find(function(t) { return t.id === taskId; });
        if (task) {
          this.currentDetailTask = task;
          this.openEditSubtaskForm(subId);
        }
        return;
      }
      
      var mainTab = e.target.closest('.main-tab');
      if (mainTab && mainTab.dataset.filter === 'today') {
        this.showDateSwitcher = !this.showDateSwitcher;
        this.debouncedRender();
        return;
      }
    },
    
    /**
     * 创建卡片上下文菜单（移动端长按）
     * @param {Object} task - 任务对象
     * @returns {Array} 菜单项数组
     */
    createCardContextMenu: function(task) {
      var self = this;
      var items = [];
      
      // 查看详情
      items.push({
        text: '查看详情',
        icon: '👁️ ',
        action: function() {
          self.openTaskDetail(task);
        }
      });
      
      // 编辑
      items.push({
        text: '编辑任务',
        icon: '✏️ ',
        action: function() {
          self.editTask(task.id);
        }
      });
      
      // 完成/取消完成
      if (!task.done) {
        items.push({
          text: '完成任务',
          icon: '✓ ',
          action: function() {
            self.completeTask(task.id);
          }
        });
      }
      
      items.push('divider');
      
      // 删除
      items.push({
        text: '删除任务',
        icon: '🗑️ ',
        className: 'danger',
        action: function() {
          if (confirm('确定要删除这个任务吗？')) {
            self.deleteTask(task.id);
          }
        }
      });
      
      return items;
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, TasksModule);
})();
