/**
 * Overview Module - 概览页面
 * 显示今日概览、统计卡片、快捷入口和最近活动
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'overview';
  
  var OverviewModule = {
    init: function() {
      LifeGame.log('[overview] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:overview', function(data) {
        var module = LifeGame.getModule('overview');
        if (module) module.render();
      });
      
      // 任务变化时刷新概览
      LifeGame.on('task:created', function() { self.refreshIfVisible(); });
      LifeGame.on('task:completed', function() { self.refreshIfVisible(); });
      LifeGame.on('task:updated', function() { self.refreshIfVisible(); });
      LifeGame.on('task:deleted', function() { self.refreshIfVisible(); });
      LifeGame.on('subtask:completed', function() { self.refreshIfVisible(); });
      
      // 时间轨迹变化时刷新概览
      LifeGame.on('timeline:recorded', function() { self.refreshIfVisible(); });
      LifeGame.on('timeline:updated', function() { self.refreshIfVisible(); });
      
      // 存储数据变化时刷新概览
      LifeGame.on('storage:changed', function() { self.refreshIfVisible(); });
    },
    
    // 如果当前在概览视图，刷新显示
    refreshIfVisible: function() {
      if (window.currentSubView === 'overview') {
        var container = document.getElementById('world-content');
        if (container) this.render(container);
      }
    },
    
    render: function(container) {
      // 优先使用 world-content，这是世界页面中的内容容器
      if (!container) {
        container = document.getElementById('world-content') || document.getElementById('app');
      }
      if (!container) {
        console.error('[overview] render 失败: 找不到容器');
        return;
      }
      
      LifeGame.log('[overview] render 到容器:', container.id || container.tagName);
      var stats = this.getStats();
      
      var html = 
        '<div class="overview-container">' +
          // 欢迎语
          '<div class="overview-welcome">' +
            '<div class="welcome-title">' + this.getGreeting() + '</div>' +
            '<div class="welcome-subtitle">' + this.getTodayStr() + '</div>' +
          '</div>' +
          
          // 今日剩余时间
          '<div class="time-remaining">' +
            '<span class="time-remaining-label">今日剩余时间</span>' +
            '<span class="time-remaining-value">' + this.getRemainingTime() + '</span>' +
          '</div>' +
          
          // 四个统计卡片
          '<div class="stats-grid">' +
            '<div class="stat-card" onclick="LifeGame.emit(\'nav:switch\', {view: \'tasks\'})">' +
              '<div class="stat-value">' + stats.tasks.completed + '/' + stats.tasks.total + '</div>' +
              '<div class="stat-label">今日任务</div>' +
              '<div class="stat-progress"><div class="stat-progress-bar" style="width:' + (stats.tasks.total > 0 ? stats.tasks.completed/stats.tasks.total*100 : 0) + '%"></div></div>' +
            '</div>' +
            '<div class="stat-card" onclick="LifeGame.emit(\'nav:switch\', {view: \'challenges\'})">' +
              '<div class="stat-value">' + stats.challenges.completed + '/' + stats.challenges.total + '</div>' +
              '<div class="stat-label">每日挑战</div>' +
              '<div class="stat-progress"><div class="stat-progress-bar" style="width:' + (stats.challenges.total > 0 ? stats.challenges.completed/stats.challenges.total*100 : 0) + '%"></div></div>' +
            '</div>' +
            '<div class="stat-card" onclick="LifeGame.emit(\'nav:switch\', {view: \'action\', subView: \'timeline\'})">' +
              '<div class="stat-value">' + (stats.timeline.hours || 0).toFixed(1) + 'h</div>' +
              '<div class="stat-label">时间记录</div>' +
              '<div class="stat-progress"><div class="stat-progress-bar" style="width:' + Math.min(100, stats.timeline.hours/8*100) + '%"></div></div>' +
            '</div>' +
            '<div class="stat-card" onclick="LifeGame.emit(\'nav:switch\', {view: \'profile\'})">' +
              '<div class="stat-value">+' + (stats.exp.today || 0).toFixed(2) + '</div>' +
              '<div class="stat-label">今日属性</div>' +
              '<div class="stat-progress"><div class="stat-progress-bar" style="width:100%"></div></div>' +
            '</div>' +
          '</div>' +
          
          // 快捷入口
          '<div class="quick-actions-title">⚡ 快捷入口</div>' +
          '<div class="quick-actions">' +
            '<div class="quick-btn" onclick="LifeGame.emit(\'nav:switch\', {view: \'tasks\'})">' +
              '<span class="quick-icon">📋</span>' +
              '<span class="quick-name">任务</span>' +
              '<span class="quick-badge">' + (stats.tasks.total - stats.tasks.completed) + '待办</span>' +
            '</div>' +
            '<div class="quick-btn" onclick="LifeGame.emit(\'nav:switch\', {view: \'challenges\'})">' +
              '<span class="quick-icon">🔥</span>' +
              '<span class="quick-name">挑战</span>' +
              '<span class="quick-badge">' + (stats.challenges.total - stats.challenges.completed) + '未完成</span>' +
            '</div>' +
            '<div class="quick-btn" onclick="LifeGame.emit(\'nav:switch\', {view: \'action\'})">' +
              '<span class="quick-icon">⚡</span>' +
              '<span class="quick-name">行动</span>' +
              '<span class="quick-badge">开始</span>' +
            '</div>' +
            '<div class="quick-btn" onclick="LifeGame.emit(\'nav:switch\', {view: \'action\', subView: \'timeline\'})">' +
              '<span class="quick-icon">📅</span>' +
              '<span class="quick-name">时间轨迹</span>' +
              '<span class="quick-badge">' + stats.timeline.records + '记录</span>' +
            '</div>' +
            '<div class="quick-btn" onclick="NavController.showStatsPage()">' +
              '<span class="quick-icon">📊</span>' +
              '<span class="quick-name">统计</span>' +
              '<span class="quick-badge">图表</span>' +
            '</div>' +
            '<div class="quick-btn" onclick="LifeGame.emit(\'nav:switch\', {view: \'history\'})">' +
              '<span class="quick-icon">📜</span>' +
              '<span class="quick-name">历史</span>' +
              '<span class="quick-badge">记录</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      container.innerHTML = html;
    },
    
    // 获取欢迎语
    getGreeting: function() {
      var hour = new Date().getHours();
      var names = ['勇士', '冒险家', '旅人', '挑战者'];
      var name = names[Math.floor(Math.random() * names.length)];
      
      if (hour < 6) return '🌙 深夜了，' + name;
      if (hour < 9) return '🌅 早上好，' + name;
      if (hour < 12) return '☀️ 上午好，' + name;
      if (hour < 14) return '🌤️ 中午好，' + name;
      if (hour < 18) return '🌤️ 下午好，' + name;
      return '🌌 晚上好，' + name;
    },
    
    // 获取今日日期字符串
    getTodayStr: function() {
      if (LifeGame.core.Utils && LifeGame.core.Utils.getTodayStr) {
        return LifeGame.core.Utils.getTodayStr();
      }
      // 降级处理
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    
    // 获取今日剩余时间
    getRemainingTime: function() {
      var now = new Date();
      var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      var diff = endOfDay - now;
      
      var hours = Math.floor(diff / (1000 * 60 * 60));
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return hours + '小时' + minutes + '分钟';
    },
    
    // 获取统计数据
    getStats: function() {
      var storage = LifeGame.core.Storage.data;
      var tasks = storage.tasks || [];
      LifeGame.log('[overview] getStats 任务总数:', tasks.length);
      var todayStr = this.getTodayStr();
      
      // 获取昨天日期
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      
      // 今日任务统计（包括今日突发任务 + 今日到期的子任务 + 昨天顺延的过期子任务）
      var totalTasks = 0;
      var completedTasks = 0;
      
      // 1. 今日突发任务（period='today'）
      tasks.forEach(function(t) {
        if (t.period === 'today') {
          totalTasks++;
          if (t.done) completedTasks++;
        }
      });
      
      // 2. 长期任务的子任务（今日到期 + 昨天顺延的过期任务）
      tasks.forEach(function(task) {
        if (task.period === 'long' && task.subtasks) {
          task.subtasks.forEach(function(sub) {
            // 跳过 daily 子任务
            if (sub.daily) return;
            
            // 今日到期的子任务
            if (sub.date === todayStr) {
              totalTasks++;
              if (sub.done) completedTasks++;
            }
            // 昨天顺延的过期任务（未完成且在昨天之前）
            else if (!sub.done && sub.date && sub.date < todayStr) {
              totalTasks++;
              // 未完成的过期任务不计入已完成
            }
          });
        }
      });
      
      // 每日挑战统计（从 challenges 模块获取）
      var dcData = storage.dailyChallenges || {};
      var todayChallenges = dcData[todayStr] || {};
      var challengeCompleted = 0;
      var challengeTotal = 10; // 固定10项
      for (var key in todayChallenges) {
        if (todayChallenges[key].completed) challengeCompleted++;
      }
      
      // 时间轨迹统计 (slots 是对象格式 {key: {attr, time, note}})
      var timelineData = storage.timelineData || {};
      var todayTimeline = timelineData[todayStr] || { slots: {} };
      var slotsObj = todayTimeline.slots || {};
      var slotsArray = Object.values(slotsObj);
      var recordedHours = slotsArray.filter(function(s) { return s.attr; }).length * 0.25;
      
      // 今日属性统计
      var expData = storage.dailyExp || {};
      var todayExp = expData[todayStr] || { total: 0 };
      
      var result = {
        tasks: { completed: completedTasks, total: totalTasks },
        challenges: { completed: challengeCompleted, total: challengeTotal },
        timeline: { hours: Math.round((recordedHours || 0) * 10) / 10, records: slotsArray.filter(function(s) { return s.attr; }).length },
        exp: { today: (todayExp && todayExp.total) || 0 }
      };
      LifeGame.log('[overview] getStats 结果:', result);
      return result;
    },
    
  };
  
  LifeGame.registerModule(MODULE_NAME, OverviewModule);
})();
