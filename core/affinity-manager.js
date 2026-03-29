/**
 * Affinity Manager - 契合度管理系统
 * 计算和管理灵魂与肉体的契合度
 */

(function() {
  'use strict';
  
  var AFFINITY_CONFIG = {
    // 契合度变化值
    changes: {
      dailyChallengeComplete: 1,     // 完成每日挑战
      dailyChallengeAllComplete: 5,  // 完成全部每日挑战
      forbidKeep: 1,                 // 遵守禁止事项
      forbidAllKeep: 5,              // 全部禁止事项遵守
      forbidViolation: -10,          // 违规
      taskComplete: 2,               // 完成任务
      longTaskComplete: 5,           // 完成长期任务
      dayPerfect: 10                 // 完美一天（全勤）
    },
    // 契合度等级
    levels: [
      { min: 0, max: 10, name: '疏离', desc: '灵魂几乎无法控制肉体', color: '#ef4444', bonus: 0 },
      { min: 10, max: 30, name: '薄弱', desc: '控制困难，容易失败', color: '#f97316', bonus: 0 },
      { min: 30, max: 50, name: '一般', desc: '基本控制，偶尔失败', color: '#eab308', bonus: 0 },
      { min: 50, max: 70, name: '良好', desc: '控制稳定', color: '#22c55e', bonus: 5 },
      { min: 70, max: 90, name: '紧密', desc: '控制精准，奖励加成', color: '#3b82f6', bonus: 10 },
      { min: 90, max: 100, name: '合一', desc: '完美控制，特殊效果', color: '#a855f7', bonus: 20 }
    ],
    // 每日最大变化限制
    dailyMaxIncrease: 30,
    dailyMaxDecrease: -30
  };
  
  LifeGame.core.AffinityManager = {
    // 初始化
    init: function() {
      LifeGame.log('[AffinityManager] 初始化');
      this.initData();
      this.bindEvents();
    },
    
    // 初始化数据
    initData: function() {
      var storage = LifeGame.core.Storage.data;
      
      if (!storage.affinity) {
        storage.affinity = {
          current: 0,           // 当前契合度 (0-100)
          history: [],          // 历史记录
          todayChange: 0,       // 今日变化
          factors: {            // 影响因素统计
            challengesCompleted: 0,
            challengesTotal: 0,
            forbiddenKept: 0,
            forbiddenTotal: 0,
            violations: 0,
            tasksCompleted: 0,
            perfectDays: 0
          }
        };
      }
      
      // 确保今日报告存在
      if (!storage.affinityReport) {
        storage.affinityReport = {
          date: this.getTodayStr(),
          changes: [],          // 今日变化明细
          summary: ''           // 总结
        };
      }
      
      // 检查是否需要重置今日数据
      this.checkDailyReset();
      
      LifeGame.core.Storage.save();
    },
    
    // 绑定事件
    bindEvents: function() {
      var self = this;
      
      // 监听每日挑战完成
      LifeGame.on('challenge:completed', function(data) {
        self.onChallengeCompleted(data);
      });
      
      // 监听禁止事项违规
      LifeGame.on('forbid:violated', function(data) {
        self.onForbidViolated(data);
      });
      
      // 监听任务完成
      LifeGame.on('task:completed', function(data) {
        self.onTaskCompleted(data);
      });
      
      // 监听完美一天（全勤）
      LifeGame.on('day:perfect', function(data) {
        self.onPerfectDay(data);
      });
      
      // 监听禁止事项结算（每天00:00）
      LifeGame.on('forbids:settled', function(data) {
        self.onForbidSettled(data);
      });
    },
    
    // 检查是否需要重置今日数据
    checkDailyReset: function() {
      var storage = LifeGame.core.Storage.data;
      var today = this.getTodayStr();
      
      if (storage.affinityReport.date !== today) {
        // 生成昨日报告
        this.generateDailyReport();
        
        // 重置今日数据
        storage.affinityReport = {
          date: today,
          changes: [],
          summary: ''
        };
        storage.affinity.todayChange = 0;
        
        // 保存历史
        if (storage.affinity.current > 0) {
          storage.affinity.history.push({
            date: storage.affinityReport.date,
            value: storage.affinity.current,
            change: storage.affinity.todayChange
          });
          // 只保留最近30天
          if (storage.affinity.history.length > 30) {
            storage.affinity.history.shift();
          }
        }
        
        LifeGame.core.Storage.save();
      }
    },
    
    // 获取今日日期字符串
    getTodayStr: function() {
      var d = new Date();
      return d.getFullYear() + '-' + 
        String(d.getMonth() + 1).padStart(2, '0') + '-' + 
        String(d.getDate()).padStart(2, '0');
    },
    
    // 修改契合度
    changeAffinity: function(amount, reason, detail) {
      var storage = LifeGame.core.Storage.data;
      var affinity = storage.affinity;
      
      // 检查每日限制
      var newTodayChange = affinity.todayChange + amount;
      if (amount > 0 && newTodayChange > AFFINITY_CONFIG.dailyMaxIncrease) {
        amount = AFFINITY_CONFIG.dailyMaxIncrease - affinity.todayChange;
      }
      if (amount < 0 && newTodayChange < AFFINITY_CONFIG.dailyMaxDecrease) {
        amount = AFFINITY_CONFIG.dailyMaxDecrease - affinity.todayChange;
      }
      
      if (amount === 0) return;
      
      var oldValue = affinity.current;
      var newValue = Math.max(0, Math.min(100, oldValue + amount));
      
      affinity.current = newValue;
      affinity.todayChange += amount;
      
      // 记录变化
      storage.affinityReport.changes.push({
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        amount: amount,
        reason: reason,
        detail: detail
      });
      
      LifeGame.core.Storage.save();
      
      // 触发事件
      LifeGame.emit('affinity:changed', {
        oldValue: oldValue,
        newValue: newValue,
        change: amount,
        reason: reason
      });
      
      LifeGame.log('[AffinityManager] 契合度变化:', oldValue, '→', newValue, '(' + (amount > 0 ? '+' : '') + amount + ')', reason);
    },
    
    // 每日挑战完成
    onChallengeCompleted: function(data) {
      this.changeAffinity(
        AFFINITY_CONFIG.changes.dailyChallengeComplete,
        '完成每日挑战',
        data.name
      );
      
      var storage = LifeGame.core.Storage.data;
      storage.affinity.factors.challengesCompleted++;
      
      // 检查是否完成全部
      if (data.allCompleted) {
        this.changeAffinity(
          AFFINITY_CONFIG.changes.dailyChallengeAllComplete,
          '完成全部每日挑战',
          '全勤奖励'
        );
      }
    },
    
    // 禁止事项违规
    onForbidViolated: function(data) {
      this.changeAffinity(
        AFFINITY_CONFIG.changes.forbidViolation,
        '违反禁止事项',
        data.name + (data.reason ? ' - ' + data.reason : '')
      );
      
      var storage = LifeGame.core.Storage.data;
      storage.affinity.factors.violations++;
    },
    
    // 禁止事项结算（每天遵守）
    onForbidSettled: function(data) {
      var storage = LifeGame.core.Storage.data;
      
      // 安全检查：确保kept数组存在
      if (data.kept && Array.isArray(data.kept)) {
        data.kept.forEach(function(item) {
          this.changeAffinity(
            AFFINITY_CONFIG.changes.forbidKeep,
            '遵守禁止事项',
            item.name
          );
          storage.affinity.factors.forbiddenKept++;
        }, this);
      }
      
      // 如果全部遵守
      if (data.allKept) {
        this.changeAffinity(
          AFFINITY_CONFIG.changes.forbidAllKeep,
          '全部禁止事项遵守',
          '完美自律'
        );
      }
    },
    
    // 任务完成
    onTaskCompleted: function(data) {
      var change = data.isLongTask ? 
        AFFINITY_CONFIG.changes.longTaskComplete : 
        AFFINITY_CONFIG.changes.taskComplete;
      
      this.changeAffinity(
        change,
        data.isLongTask ? '完成长期任务' : '完成任务',
        data.name
      );
      
      var storage = LifeGame.core.Storage.data;
      storage.affinity.factors.tasksCompleted++;
    },
    
    // 完美一天（全勤）
    onPerfectDay: function(data) {
      this.changeAffinity(
        AFFINITY_CONFIG.changes.dayPerfect,
        '完美的一天',
        '完成所有挑战和禁止事项'
      );
      
      var storage = LifeGame.core.Storage.data;
      storage.affinity.factors.perfectDays++;
    },
    
    // 获取契合度等级
    getLevel: function(value) {
      if (value === undefined) {
        value = LifeGame.core.Storage.data.affinity.current;
      }
      
      for (var i = 0; i < AFFINITY_CONFIG.levels.length; i++) {
        var level = AFFINITY_CONFIG.levels[i];
        if (value >= level.min && value < level.max) {
          return level;
        }
      }
      return AFFINITY_CONFIG.levels[AFFINITY_CONFIG.levels.length - 1];
    },
    
    // 获取当前奖励加成
    getBonus: function() {
      var level = this.getLevel();
      return level.bonus;
    },
    
    // 生成每日报告
    generateDailyReport: function() {
      var storage = LifeGame.core.Storage.data;
      var report = storage.affinityReport;
      
      if (!report || report.changes.length === 0) {
        return null;
      }
      
      var totalChange = report.changes.reduce(function(sum, c) {
        return sum + c.amount;
      }, 0);
      
      var positiveChanges = report.changes.filter(function(c) {
        return c.amount > 0;
      });
      
      var negativeChanges = report.changes.filter(function(c) {
        return c.amount < 0;
      });
      
      var summary = '';
      if (totalChange > 0) {
        summary = '今日契合度提升' + totalChange + '%，' + 
          positiveChanges.length + '次正向行为。';
        if (negativeChanges.length > 0) {
          summary += '但有' + negativeChanges.length + '次失误，需引以为戒。';
        }
      } else if (totalChange < 0) {
        summary = '今日契合度下降' + Math.abs(totalChange) + '%，' +
          '灵魂控制力减弱。建议冥想反思，明日再战。';
      } else {
        summary = '今日契合度无变化，保持平稳状态。';
      }
      
      report.summary = summary;
      
      // 保存到历史报告
      if (!storage.affinityReports) {
        storage.affinityReports = [];
      }
      storage.affinityReports.push({
        date: report.date,
        change: totalChange,
        summary: summary,
        details: report.changes
      });
      
      // 只保留最近30天
      if (storage.affinityReports.length > 30) {
        storage.affinityReports.shift();
      }
      
      LifeGame.core.Storage.save();
      
      return report;
    },
    
    // 获取今日报告
    getTodayReport: function() {
      this.checkDailyReset();
      return LifeGame.core.Storage.data.affinityReport;
    },
    
    // 获取历史报告
    getHistoryReports: function(days) {
      days = days || 7;
      var storage = LifeGame.core.Storage.data;
      var reports = storage.affinityReports || [];
      return reports.slice(-days);
    },
    
    // 获取契合度数据（用于显示）
    getData: function() {
      this.checkDailyReset();
      var storage = LifeGame.core.Storage.data;
      return {
        current: storage.affinity.current,
        level: this.getLevel(),
        todayChange: storage.affinity.todayChange,
        factors: storage.affinity.factors,
        history: storage.affinity.history,
        report: this.getTodayReport(),
        bonus: this.getBonus()
      };
    }
  };
})();
