/**
 * Challenges 模块 - 挑战系统（含骰子宝箱）
 * 
 * 功能：
 * 1. 每日挑战管理
 * 2. 禁止事项管理（含保护卡机制）
 * 3. 骰子宝箱系统 - 全勤后获得骰子，玩家主动开启
 * 4. 支持批量开启骰子
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'challenges';
  
  // 禁止事项等级配置
  var LEVEL_CONFIG = {
    'F':   { minDays: 0,    dice: 1,  protectCard: 0, next: 'E' },
    'E':   { minDays: 7,    dice: 2,  protectCard: 1, next: 'D' },
    'D':   { minDays: 30,   dice: 3,  protectCard: 2, next: 'C' },
    'C':   { minDays: 180,  dice: 4,  protectCard: 3, next: 'B' },
    'B':   { minDays: 365,  dice: 5,  protectCard: 4, next: 'A' },
    'A':   { minDays: 1095, dice: 6,  protectCard: 5, next: 'S' },
    'S':   { minDays: 3650, dice: 8,  protectCard: 6, next: 'SS' },
    'SS':  { minDays: 7300, dice: 10, protectCard: 8, next: 'SSS' },
    'SSS': { minDays: 7301, dice: 20, protectCard: 10, next: null }
  };

  // 10项固定每日挑战配置（带等级）
  var DAILY_CHALLENGES_CONFIG = window.DAILY_CHALLENGES_CONFIG = [
    { id: 'dc_1', name: '晨起仪式', target: '6点前醒，喝温水，晨刷', bindTask: '硅基的尽头', exp: 1, level: 'F' },
    { id: 'dc_2', name: '冥想', target: '早晚各15分钟', bindTask: '精神力', exp: 1, level: 'F' },
    { id: 'dc_3', name: '健身', target: '1.5小时力量训练', bindTask: '硅基的尽头', exp: 1, level: 'F' },
    { id: 'dc_4', name: '瑜伽', target: '0.5小时拉伸', bindTask: '硅基的尽头', exp: 1, level: 'F' },
    { id: 'dc_5', name: '读书', target: '0.5小时阅读', bindTask: '精神力', exp: 1, level: 'F' },
    { id: 'dc_6', name: '日更vlog', target: '录制或剪辑视频', bindTask: '自媒体', exp: 1, level: 'F' },
    { id: 'dc_7', name: '记账', target: '记录当日收支', bindTask: '赚钱', exp: 1, level: 'F' },
    { id: 'dc_8', name: '一生之誓', target: '铲猫砂+遛狗', bindTask: '硅基的尽头', exp: 1, level: 'F' },
    { id: 'dc_9', name: '钢铁的心', target: '1小时AI学习/实践', bindTask: 'AI时代', exp: 1, level: 'F' },
    { id: 'dc_10', name: '夜终仪式', target: 'Echo总结→写感想→规划+夜刷', bindTask: '精神力', exp: 1, level: 'F' }
  ];

  // 10项固定禁止事项配置
  var FORBIDDEN_ITEMS_CONFIG = window.FORBIDDEN_ITEMS_CONFIG = [
    { id: 'fb_1', name: '戒烟', difficulty: 3, difficultyText: '🔴🔴🔴', status: 'restart' },
    { id: 'fb_2', name: '戒妄（THC）', difficulty: 3, difficultyText: '🔴🔴🔴', status: 'continue' },
    { id: 'fb_3', name: '戒色', difficulty: 3, difficultyText: '🔴🔴🔴', status: 'restart' },
    { id: 'fb_4', name: '戒槟榔', difficulty: 3, difficultyText: '⭐⭐⭐', status: 'new' },
    { id: 'fb_5', name: '戒游戏', difficulty: 2, difficultyText: '⭐⭐', status: 'continue' },
    { id: 'fb_6', name: '戒负债', difficulty: 2, difficultyText: '⭐⭐', status: 'new' },
    { id: 'fb_7', name: '戒糖', difficulty: 2, difficultyText: '⭐⭐', status: 'continue' },
    { id: 'fb_8', name: '戒酒', difficulty: 2, difficultyText: '⭐⭐', status: 'continue' },
    { id: 'fb_9', name: '戒冰水', difficulty: 1, difficultyText: '⭐', status: 'new' },
    { id: 'fb_10', name: '戒烫水澡', difficulty: 1, difficultyText: '⭐', status: 'continue' }
  ];

  var ChallengesModule = {
    tasks: [],
    forbids: [],
    currentFilter: 'daily',
    diceChest: {},
    isRolling: false,
    dailyChallenges: [],
    todayRecords: {},
    forbiddenItems: [],
    forbidTodayRecords: {},
    isSaving: false,
    _eventHandlers: {},
    // 存储活动的骰子动画遮罩层，用于清理
    _activeOverlays: [],
    _animationTimers: [],
    
    /**
     * 初始化模块
     */
    init: function() {
      LifeGame.log('[challenges] 初始化');
      this.cleanup();
      this.loadData();
      this.checkDayReset();
      this.bindEvents();
      var self = this;
      setTimeout(function() {
        self.checkYesterdayPerfectDay();
      }, 500);
    },
    
    /**
     * 加载数据
     */
    loadData: function() {
      var storage = LifeGame.core.Storage.data;
      var tasks = storage.tasks || [];
      var forbids = storage.forbids || [];
      this.tasks = Array.isArray(tasks) ? tasks : [];
      this.forbids = Array.isArray(forbids) ? forbids : [];
      
      var diceChestData = storage.diceChest || {};
      this.diceChest = diceChestData;
      
      var dcData = storage.dailyChallenges || {};
      this.todayRecords = dcData[this.getTodayStr()] || {};
      
      this.initDailyChallenges();
      this.initForbiddenItems();
      
      this.perfectRecord = storage.perfectRecord || { streak: 0, total: 0, lastDate: null };
    },
    
    /**
     * 清理资源
     */
    cleanup: function() {
      var container = document.getElementById('world-content');
      if (container && this._eventHandlers) {
        if (this._eventHandlers.click) {
          container.removeEventListener('click', this._eventHandlers.click);
        }
        if (this._eventHandlers.dblclick) {
          container.removeEventListener('dblclick', this._eventHandlers.dblclick);
        }
        this._eventHandlers = {};
      }
      // 清除所有容器上的事件绑定标记
      if (container) {
        container.dataset.challengesEventsBound = '';
      }
      
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
        this.renderTimeout = null;
      }
    },
    
    /**
     * 初始化禁止事项
     */
    initForbiddenItems: function() {
      var self = this;
      var storage = LifeGame.core.Storage.data;
      var savedItems = storage.forbiddenItems || {};
      var today = this.getTodayStr();
      
      var fbRecords = storage.forbidRecords || {};
      this.forbidTodayRecords = fbRecords[today] || {};
      
      this.forbiddenItems = FORBIDDEN_ITEMS_CONFIG.map(function(cfg) {
        var saved = savedItems[cfg.id] || {};
        var todayRec = self.forbidTodayRecords[cfg.id] || {};
        
        return {
          id: cfg.id,
          name: cfg.name,
          difficulty: cfg.difficulty,
          difficultyText: cfg.difficultyText,
          level: saved.level || 'F',
          days: saved.days || 0,
          totalDays: saved.totalDays || 0,
          protectionCards: saved.protectionCards || 0,
          todayStatus: todayRec.status || 'pending',
          todayTime: todayRec.time || null,
          todayReason: todayRec.reason || null,
          history: saved.history || []
        };
      });
    },
    
    /**
     * 初始化每日挑战
     */
    initDailyChallenges: function() {
      var self = this;
      
      // 加载固定配置的10项每日挑战
      var fixedChallenges = DAILY_CHALLENGES_CONFIG.map(function(cfg) {
        var record = self.todayRecords[cfg.id] || {};
        return {
          id: cfg.id,
          name: cfg.name,
          target: cfg.target,
          bindTask: cfg.bindTask,
          exp: cfg.exp,
          level: cfg.level || 'F',
          completed: record.completed || false,
          time: record.time || null,
          expAwarded: record.expAwarded || false,
          isCustom: false
        };
      });
      
      // 加载用户自定义的每日挑战
      var storage = LifeGame.core.Storage.data;
      var customChallenges = [];
      if (storage.dailyChallenges && storage.dailyChallenges.custom) {
        customChallenges = storage.dailyChallenges.custom.map(function(cfg) {
          var record = self.todayRecords[cfg.id] || {};
          return {
            id: cfg.id,
            name: cfg.name,
            target: cfg.target,
            bindTask: cfg.bindTask,
            bindTaskId: cfg.bindTaskId,
            exp: cfg.exp,
            level: cfg.level || 'F',
            completed: record.completed || false,
            time: record.time || null,
            expAwarded: record.expAwarded || false,
            isCustom: true
          };
        });
      }
      
      this.dailyChallenges = fixedChallenges.concat(customChallenges);
    },
    
    /**
     * 检查跨天重置
     */
    checkDayReset: function() {
      var storage = LifeGame.core.Storage.data;
      var lastCheck = storage.lastChallengeCheck;
      var today = this.getTodayStr();
      
      if (lastCheck !== today) {
        this.isSaving = true;
        
        this.processYesterdayForbids();
        
        this.todayRecords = {};
        this.forbidTodayRecords = {};
        
        this.initDailyChallenges();
        this.initForbiddenItems();
        
        LifeGame.core.Storage.set('lastChallengeCheck', today);
        
        this.saveDailyChallengesInternal();
        this.saveForbidRecordsInternal();
        
        this.isSaving = false;
      }
    },
    
    /**
     * 处理昨日禁止事项结算
     */
    processYesterdayForbids: function() {
      var yesterday = this.getYesterdayStr();
      var storage = LifeGame.core.Storage.data;
      var fbRecords = storage.forbidRecords || {};
      var yesterdayRecords = fbRecords[yesterday] || {};
      var savedItems = storage.forbiddenItems || {};
      
      var totalDiamonds = 0;
      var completedCount = 0;
      var violatedCount = 0;
      var self = this;
      
      FORBIDDEN_ITEMS_CONFIG.forEach(function(cfg) {
        var rec = yesterdayRecords[cfg.id];
        var saved = savedItems[cfg.id] || {};
        
        if (!rec || rec.status !== 'violated') {
          completedCount++;
          
          saved.days = (saved.days || 0) + 1;
          saved.totalDays = (saved.totalDays || 0) + 1;
          
          var currentLevel = saved.level || 'F';
          var config = LEVEL_CONFIG[currentLevel];
          if (config && config.next) {
            var nextConfig = LEVEL_CONFIG[config.next];
            if (saved.totalDays >= nextConfig.minDays) {
              saved.level = config.next;
              saved.protectionCards = (saved.protectionCards || 0) + nextConfig.protectCard;
            }
          }
          
          var levelConfig = LEVEL_CONFIG[saved.level] || LEVEL_CONFIG['F'];
          var diamonds = levelConfig.dice || 1;
          totalDiamonds += diamonds;
          
          if (!fbRecords[yesterday]) fbRecords[yesterday] = {};
          fbRecords[yesterday][cfg.id] = {
            status: 'completed',
            time: '00:00',
            auto: true
          };
        } else {
          violatedCount++;
        }
        
        savedItems[cfg.id] = saved;
      });
      
      LifeGame.core.Storage.set('forbiddenItems', savedItems);
      LifeGame.core.Storage.set('forbidRecords', fbRecords);
      
      var diceBonus = 0;
      if (completedCount === 10) {
        diceBonus = Math.floor(Math.random() * 6) + 1;
      }
      
      var total = totalDiamonds + diceBonus;
      
      if (total > 0) {
        var profile = storage.profile || {};
        profile.diamonds = (profile.diamonds || 0) + total;
        LifeGame.core.Storage.set('profile', profile);
        
        var diamondsData = storage.diamonds || {};
        diamondsData[yesterday] = {
          base: totalDiamonds,
          dice: diceBonus > 0 ? 1 : 0,
          diceResult: diceBonus,
          total: total,
          completed: completedCount,
          violated: violatedCount,
          awardedAt: new Date().toISOString()
        };
        LifeGame.core.Storage.set('diamonds', diamondsData);
        
        LifeGame.emit('forbids:settled', { 
          date: yesterday, 
          completed: completedCount,
          violated: violatedCount,
          base: totalDiamonds, 
          dice: diceBonus, 
          total: total,
          allKept: completedCount === 10
        });
        
        LifeGame.emit('forbid:settled', {
          kept: FORBIDDEN_ITEMS_CONFIG.filter(function(cfg) {
            var rec = yesterdayRecords[cfg.id];
            return !rec || rec.status !== 'violated';
          }).map(function(cfg) {
            return { name: cfg.name };
          }),
          allKept: completedCount === 10
        });
      } else {
        LifeGame.emit('forbid:settled', {
          kept: [],
          allKept: false
        });
      }
    },
    
    saveForbidRecordsInternal: function() {
      var storage = LifeGame.core.Storage.data;
      var fbRecords = storage.forbidRecords || {};
      fbRecords[this.getTodayStr()] = this.forbidTodayRecords;
      LifeGame.core.Storage.set('forbidRecords', fbRecords);
    },
    
    saveForbidRecords: function() {
      this.isSaving = true;
      this.saveForbidRecordsInternal();
      this.isSaving = false;
    },
    
    saveForbiddenItems: function() {
      this.isSaving = true;
      var storage = LifeGame.core.Storage.data;
      var savedItems = {};
      
      this.forbiddenItems.forEach(function(item) {
        savedItems[item.id] = {
          level: item.level,
          days: item.days,
          totalDays: item.totalDays,
          protectionCards: item.protectionCards,
          history: item.history
        };
      });
      
      LifeGame.core.Storage.set('forbiddenItems', savedItems);
      this.isSaving = false;
    },
    
    saveDailyChallengesInternal: function() {
      var storage = LifeGame.core.Storage.data;
      var dcData = storage.dailyChallenges || {};
      dcData[this.getTodayStr()] = this.todayRecords;
      LifeGame.core.Storage.set('dailyChallenges', dcData);
    },
    
    saveDailyChallenges: function() {
      this.isSaving = true;
      this.saveDailyChallengesInternal();
      this.isSaving = false;
    },
    
    saveData: function() {
      LifeGame.core.Storage.set('forbids', this.forbids);
      LifeGame.core.Storage.set('diceChest', this.diceChest);
    },
    
    bindEvents: function() {
      var self = this;
      
      this.renderTimeout = null;
      this.pendingRender = false;
      
      LifeGame.on('view:challenges', function(data) {
        var filter = data && data.filter;
        if (filter !== 'daily' && filter !== 'forbid') {
          filter = 'daily';
        }
        self.currentFilter = filter;
      });
      
      LifeGame.on('storage:changed', function() {
        if (self.isSaving) {
          return;
        }
        self.loadData();
        if (window.currentSubView === 'challenges') {
          self.debouncedRender();
        }
      });
      
      LifeGame.on('task:updated', function() {
        self.loadData();
        self.debouncedRender();
      });
    },
    
    /**
     * 获取渲染容器
     * @returns {HTMLElement|null} 渲染容器
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
      this.pendingRender = true;
      
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
      }
      
      this.renderTimeout = setTimeout(function() {
        if (self.pendingRender) {
          self.pendingRender = false;
          var container = self.getRenderContainer();
          if (container) self.render(container);
        }
      }, 50);
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
     * 获取昨天日期字符串
     * @returns {string} 日期字符串
     */
    getYesterdayStr: function() {
      if (LifeGame.core.Utils && LifeGame.core.Utils.getYesterdayStr) {
        return LifeGame.core.Utils.getYesterdayStr();
      }
      // 降级处理
      var d = new Date();
      d.setDate(d.getDate() - 1);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 检查昨日全勤
     */
    checkYesterdayPerfectDay: function() {
      var yesterday = this.getYesterdayStr();
      var today = this.getTodayStr();
      var storage = LifeGame.core.Storage.data;
      
      var lastCheck = storage.lastPerfectCheck;
      if (lastCheck === today) {
        return;
      }
      
      var dcData = storage.dailyChallenges || {};
      var yesterdayChallenges = dcData[yesterday] || {};
      
      var challengeAllCompleted = true;
      var completedChallengesCount = 0;
      
      DAILY_CHALLENGES_CONFIG.forEach(function(cfg) {
        var rec = yesterdayChallenges[cfg.id];
        if (rec && rec.completed) {
          completedChallengesCount++;
        } else {
          challengeAllCompleted = false;
        }
      });
      
      var fbRecords = storage.forbidRecords || {};
      var yesterdayForbids = fbRecords[yesterday] || {};
      
      var forbidAllCompleted = true;
      var completedForbidsCount = 0;
      var violatedCount = 0;
      
      FORBIDDEN_ITEMS_CONFIG.forEach(function(cfg) {
        var rec = yesterdayForbids[cfg.id];
        if (rec && rec.status === 'violated') {
          violatedCount++;
          forbidAllCompleted = false;
        } else {
          completedForbidsCount++;
        }
      });
      
      var isPerfectDay = challengeAllCompleted && forbidAllCompleted;
      
      this.isSaving = true;
      var perfectDaysData = storage.perfectDays || {};
      if (!perfectDaysData[yesterday]) {
        perfectDaysData[yesterday] = {
          date: yesterday,
          challengeCompleted: challengeAllCompleted,
          forbidCompleted: forbidAllCompleted,
          allCompleted: isPerfectDay,
          challengesCount: completedChallengesCount,
          forbidsCount: completedForbidsCount
        };
        LifeGame.core.Storage.set('perfectDays', perfectDaysData);
      }
      
      if (isPerfectDay) {
        var diceChestData = storage.diceChest || {};
        
        if (!diceChestData[yesterday]) {
          var diceResult = Math.floor(Math.random() * 6) + 1;
          
          diceChestData[yesterday] = {
            date: yesterday,
            generated: true,
            opened: false,
            diceCount: 1,
            diceResult: diceResult,
            diamondsAwarded: 0,
            challengeAllCompleted: challengeAllCompleted,
            forbidAllCompleted: forbidAllCompleted
          };
          
          this.diceChest = diceChestData;
          LifeGame.core.Storage.set('diceChest', diceChestData);
          
          this.updatePerfectStreak(yesterday);
        } else {
          this.diceChest = diceChestData;
        }
      } else {
        this.resetPerfectStreak();
      }
      
      LifeGame.core.Storage.set('lastPerfectCheck', today);
      this.isSaving = false;
    },
    
    /**
     * 更新连续全勤天数
     * @param {string} date - 日期字符串
     */
    updatePerfectStreak: function(date) {
      var storage = LifeGame.core.Storage.data;
      var perfectRecord = storage.perfectRecord || { streak: 0, total: 0, lastDate: null };
      
      var yesterday = this.getYesterdayStr();
      
      if (perfectRecord.lastDate === yesterday) {
        perfectRecord.streak++;
      } else {
        perfectRecord.streak = 1;
      }
      
      perfectRecord.total++;
      perfectRecord.lastDate = date;
      
      LifeGame.core.Storage.set('perfectRecord', perfectRecord);
      
      if (perfectRecord.streak === 7) {
        alert('🏆 连续全勤7天成就！');
      } else if (perfectRecord.streak === 30) {
        alert('🏆 连续全勤30天成就！');
      } else if (perfectRecord.streak === 100) {
        alert('🏆 连续全勤100天成就！');
      }
    },
    
    /**
     * 重置连续全勤
     */
    resetPerfectStreak: function() {
      var storage = LifeGame.core.Storage.data;
      var perfectRecord = storage.perfectRecord || { streak: 0, total: 0, lastDate: null };
      
      if (perfectRecord.streak > 0) {
        perfectRecord.streak = 0;
        perfectRecord.lastDate = null;
        LifeGame.core.Storage.set('perfectRecord', perfectRecord);
      }
    },
    
    /**
     * 获取未开启骰子总数
     * @returns {number} 未开启骰子数
     */
    getTotalUnopenedDice: function() {
      var total = 0;
      var self = this;
      Object.keys(this.diceChest).forEach(function(date) {
        var chest = self.diceChest[date];
        if (chest && !chest.opened) {
          total += chest.diceCount || 0;
        }
      });
      return total;
    },
    
    /**
     * 获取未开启宝箱数量
     * @returns {number} 宝箱数量
     */
    getUnopenedChestCount: function() {
      var count = 0;
      var self = this;
      Object.keys(this.diceChest).forEach(function(date) {
        var chest = self.diceChest[date];
        if (chest && !chest.opened) count++;
      });
      return count;
    },
    
    /**
     * 开启单个宝箱
     * @param {string} date - 日期字符串
     */
    openDiceChest: function(date) {
      if (this.isRolling) return;
      
      var chest = this.diceChest[date];
      if (!chest || chest.opened) {
        return;
      }
      
      this.isRolling = true;
      
      var diceResult = chest.diceResult;
      
      chest.opened = true;
      chest.diamondsAwarded = diceResult;
      chest.openedAt = new Date().toISOString();
      
      this.awardDiamonds(diceResult);
      
      this.isSaving = true;
      LifeGame.core.Storage.set('diceChest', this.diceChest);
      this.isSaving = false;
      
      this.showDiceRollAnimation(date, diceResult, function() {
        this.isRolling = false;
        this.debouncedRender();
      }.bind(this));
    },
    
    /**
     * 批量开启所有宝箱
     */
    openAllDiceChests: function() {
      if (this.isRolling) return;
      
      var unopenedDates = [];
      var self = this;
      Object.keys(this.diceChest).forEach(function(date) {
        if (!self.diceChest[date].opened) {
          unopenedDates.push(date);
        }
      });
      
      if (unopenedDates.length === 0) return;
      
      this.isRolling = true;
      
      var totalDiamonds = 0;
      var allResults = [];
      
      unopenedDates.forEach(function(date) {
        var chest = self.diceChest[date];
        var diceResult = chest.diceResult;
        
        chest.opened = true;
        chest.diamondsAwarded = diceResult;
        chest.openedAt = new Date().toISOString();
        
        totalDiamonds += diceResult;
        allResults.push({
          date: date,
          result: diceResult
        });
      });
      
      this.awardDiamonds(totalDiamonds);
      
      this.isSaving = true;
      LifeGame.core.Storage.set('diceChest', this.diceChest);
      this.isSaving = false;
      
      this.showBatchDiceAnimation(allResults, totalDiamonds, function() {
        this.isRolling = false;
        this.debouncedRender();
      }.bind(this));
    },
    
    /**
     * 发放钻石
     * @param {number} amount - 钻石数量
     */
    awardDiamonds: function(amount) {
      var profile = LifeGame.core.Storage.get('profile') || {};
      profile.diamonds = (profile.diamonds || 0) + amount;
      LifeGame.core.Storage.set('profile', profile);
      LifeGame.emit('diamonds:earned', { amount: amount });
    },
    
    /**
     * 显示单个骰子动画
     * @param {string} date - 日期
     * @param {number} diceResult - 骰子结果
     * @param {Function} callback - 回调函数
     */
    showDiceRollAnimation: function(date, diceResult, callback) {
      var self = this;
      var container = document.getElementById('app');
      if (!container) {
        if (callback) callback();
        return;
      }
      
      var overlay = document.createElement('div');
      overlay.className = 'dice-overlay';
      
      // 存储引用以便清理
      this._activeOverlays.push(overlay);
      
      overlay.innerHTML = [
        '<div class="dice-animation-container">',
          '<div class="dice-animation-header">',
            '<h3>🎲 ' + date + ' 全勤奖励</h3>',
            '<p>1颗骰子</p>',
          '</div>',
          '<div class="dice-rolling-area">',
            '<div class="dice-item rolling">' + self.getDiceFace(1) + '</div>',
          '</div>',
          '<div class="dice-result-area" style="display:none;">',
            '<div class="dice-item rolled">' + self.getDiceFace(diceResult) + '</div>',
            '<div class="dice-total">+' + diceResult + ' 💎</div>',
            '<button class="dice-confirm-btn">收下奖励</button>',
          '</div>',
        '</div>'
      ].join('');
      
      container.appendChild(overlay);
      
      var timer1 = setTimeout(function() {
        var diceItem = overlay.querySelector('.dice-item');
        if (diceItem) {
          diceItem.classList.remove('rolling');
          diceItem.classList.add('rolled');
        }
        
        var timer2 = setTimeout(function() {
          var rollingArea = overlay.querySelector('.dice-rolling-area');
          var resultArea = overlay.querySelector('.dice-result-area');
          if (rollingArea) rollingArea.style.display = 'none';
          if (resultArea) resultArea.style.display = 'block';
        }, 800);
        
        self._animationTimers.push(timer2);
      }, 1000);
      
      this._animationTimers.push(timer1);
      
      overlay.querySelector('.dice-confirm-btn').addEventListener('click', function() {
        overlay.remove();
        // 从活动列表中移除
        var index = self._activeOverlays.indexOf(overlay);
        if (index > -1) {
          self._activeOverlays.splice(index, 1);
        }
        if (callback) callback();
      });
    },
    
    /**
     * 显示批量骰子动画
     * @param {Array} allResults - 所有结果
     * @param {number} totalDiamonds - 总钻石数
     * @param {Function} callback - 回调函数
     */
    showBatchDiceAnimation: function(allResults, totalDiamonds, callback) {
      var self = this;
      var container = document.getElementById('app');
      if (!container) {
        if (callback) callback();
        return;
      }
      
      var overlay = document.createElement('div');
      overlay.className = 'dice-overlay';
      
      // 存储引用以便清理
      this._activeOverlays.push(overlay);
      
      overlay.innerHTML = [
        '<div class="dice-animation-container batch">',
          '<div class="dice-animation-header">',
            '<h3>🎲 批量开启</h3>',
            '<p>' + allResults.length + '个宝箱</p>',
          '</div>',
          '<div class="batch-dice-summary">',
            allResults.map(function(item) {
              return '<div class="batch-item">' + item.date + ': ' + item.result + '💎</div>';
            }).join(''),
          '</div>',
          '<div class="dice-total large">+' + totalDiamonds + ' 💎</div>',
          '<button class="dice-confirm-btn">收下奖励</button>',
        '</div>'
      ].join('');
      
      container.appendChild(overlay);
      
      overlay.querySelector('.dice-confirm-btn').addEventListener('click', function() {
        overlay.remove();
        // 从活动列表中移除
        var index = self._activeOverlays.indexOf(overlay);
        if (index > -1) {
          self._activeOverlays.splice(index, 1);
        }
        if (callback) callback();
      });
    },
    
    /**
     * 获取骰子点数对应的Unicode
     * @param {number} n - 点数
     * @returns {string} Unicode字符
     */
    getDiceFace: function(n) {
      var faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return faces[n - 1] || '⚀';
    },
    
    /**
     * 获取历史记录
     * @param {number} days - 天数
     * @returns {Array} 历史记录数组
     */
    getHistory: function(days) {
      days = days || 7;
      var storage = LifeGame.core.Storage.data;
      var dcData = storage.dailyChallenges || {};
      var history = [];
      
      for (var i = 0; i < days; i++) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        var dayData = dcData[dateStr];
        if (dayData) {
          var completed = 0;
          var total = 0;
          
          DAILY_CHALLENGES_CONFIG.forEach(function(cfg) {
            var rec = dayData[cfg.id];
            if (rec && rec.completed) completed++;
            total++;
          });
          
          history.push({
            date: dateStr,
            completed: completed,
            total: total,
            allCompleted: dayData.bonusAwarded || false
          });
        } else {
          history.push({
            date: dateStr,
            completed: 0,
            total: 0,
            allCompleted: false
          });
        }
      }
      
      return history;
    },
    
    /**
     * 渲染历史记录
     * @returns {string} HTML字符串
     */
    renderHistory: function() {
      var history = this.getHistory(7);
      
      var html = '<div class="history-section">' +
        '<h3>📊 最近7天记录</h3>' +
        '<div class="history-list">';
      
      history.forEach(function(day) {
        var statusIcon = day.allCompleted ? '🎉' : (day.completed > 0 ? '✓' : '○');
        var statusClass = day.allCompleted ? 'all-completed' : (day.completed > 0 ? 'partial' : 'none');
        
        html += '<div class="history-item ' + statusClass + '">' +
          '<span class="history-date">' + day.date + '</span>' +
          '<span class="history-status">' + statusIcon + ' ' + day.completed + '/' + day.total + '</span>' +
        '</div>';
      });
      
      html += '</div></div>';
      return html;
    },
    
    /**
     * 获取每日挑战列表
     * @returns {Array} 每日挑战列表
     */
    getDailyChallenges: function() {
      var forbidNames = this.forbids.map(function(f) { return f.n; });
      
      var tasksModule = LifeGame.getModule('tasks');
      if (tasksModule && tasksModule.getDailyChallenges) {
        return tasksModule.getDailyChallenges(forbidNames);
      }
      
      return [];
    },
    
    /**
     * 计算等级
     * @param {number} totalDays - 总天数
     * @returns {Object} 等级对象
     */
    calculateLevel: function(totalDays) {
      var levels = [
        { rank: 'SSS', min: 7301, class: 'rank-sss' },
        { rank: 'SS', min: 7300, class: 'rank-ss' },
        { rank: 'S', min: 3650, class: 'rank-s' },
        { rank: 'A', min: 1095, class: 'rank-a' },
        { rank: 'B', min: 365, class: 'rank-b' },
        { rank: 'C', min: 180, class: 'rank-c' },
        { rank: 'D', min: 30, class: 'rank-d' },
        { rank: 'E', min: 7, class: 'rank-e' },
        { rank: 'F', min: 1, class: 'rank-f' }
      ];
      
      for (var i = 0; i < levels.length; i++) {
        if (totalDays >= levels[i].min) {
          return levels[i];
        }
      }
      return levels[8];
    },
    
    /**
     * 获取进度
     * @param {string} subtaskId - 子任务ID
     * @returns {Object} 进度对象
     */
    getProgress: function(subtaskId) {
      var storage = LifeGame.core.Storage.data;
      var records = storage.dailyRecords || {};
      return records[subtaskId] || { totalDays: 0, streak: 0, failStreak: 0 };
    },
    
    /**
     * 渲染挑战页面
     * @param {HTMLElement} container - 渲染容器
     */
    render: function(container) {
      if (this.currentFilter !== 'daily' && this.currentFilter !== 'forbid') {
        this.currentFilter = 'daily';
      }
      
      if (!container) {
        LifeGame.error('[challenges] 错误：没有传入容器');
        return;
      }
      if (container.id === 'app') {
        LifeGame.error('[challenges] 错误：尝试渲染到 #app，已取消');
        return;
      }
      
      var html = this.renderHeader();
      
      html += this.renderDiceChest();
      
      if (this.currentFilter === 'daily') {
        html += this.renderDailyChallenges();
      } else {
        html += this.renderForbids();
      }
      
      container.innerHTML = html;
      this.attachEvents();
    },
    
    /**
     * 渲染头部
     * @returns {string} HTML字符串
     */
    renderHeader: function() {
      var profile = LifeGame.core.Storage.get('profile') || {};
      var totalDiamonds = profile.diamonds || 0;
      
      var addBtn = '';
      if (this.currentFilter === 'daily') {
        addBtn = '<button class="add-challenge-btn" id="add-challenge-btn">+ 添加每日挑战</button>';
      } else {
        addBtn = '<button class="add-challenge-btn" id="add-forbid-btn">+ 添加禁止事项</button>';
      }
      
      return '<div class="challenges-header">' +
        '<div class="filter-tabs">' +
          '<button class="filter-btn ' + (this.currentFilter === 'daily' ? 'active' : '') + '" data-filter="daily">🔥 每日挑战</button>' +
          '<button class="filter-btn ' + (this.currentFilter === 'forbid' ? 'active' : '') + '" data-filter="forbid">🚫 禁止事项</button>' +
        '</div>' +
        addBtn +
      '</div>';
    },
    
    /**
     * 渲染骰子宝箱
     * @returns {string} HTML字符串
     */
    renderDiceChest: function() {
      var unopenedCount = this.getUnopenedChestCount();
      var totalUnopenedDice = this.getTotalUnopenedDice();
      
      if (unopenedCount === 0) {
        return '';
      }
      
      var self = this;
      var chestItemsHtml = '';
      
      Object.keys(this.diceChest).forEach(function(date) {
        var chest = self.diceChest[date];
        if (chest && !chest.opened) {
          chestItemsHtml += [
            '<div class="chest-item" data-date="' + date + '">',
              '<div class="chest-icon">🎲</div>',
              '<div class="chest-info">',
                '<div class="chest-name">' + date + ' 全勤奖励</div>',
                '<div class="chest-meta">' + chest.diceCount + '颗骰子 · 连续' + (self.perfectRecord.streak || 0) + '天</div>',
              '</div>',
              '<button class="chest-open-btn" data-date="' + date + '">开启</button>',
            '</div>'
          ].join('');
        }
      });
      
      return [
        '<div class="dice-chest-section">',
          '<div class="chest-header">',
            '<h3>🎁 骰子宝箱</h3>',
            '<span class="chest-count">' + unopenedCount + '个待开启</span>',
          '</div>',
          '<div class="chest-hint">昨日全勤奖励，点击开启获得钻石</div>',
          '<div class="chest-list">' + chestItemsHtml + '</div>',
          unopenedCount > 1 ? '<button class="chest-open-all-btn" id="open-all-chests">🎲 批量开启全部 (' + totalUnopenedDice + '颗骰子)</button>' : '',
        '</div>'
      ].join('');
    },
    
    /**
     * 渲染每日挑战
     * @returns {string} HTML字符串
     */
    renderDailyChallenges: function() {
      var self = this;
      
      var sortedChallenges = this.applyOrder(this.dailyChallenges, 'challenge_order_daily');
      
      var completedCount = sortedChallenges.filter(function(c) { return c.completed; }).length;
      var totalCount = sortedChallenges.length;
      var progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      var headerHtml = '<div class="daily-progress-header">' +
        '<span class="progress-title">今日进度</span>' +
        '<span class="progress-count">' + completedCount + '/' + totalCount + '</span>' +
      '</div>' +
      '<div class="daily-progress-bar">' +
        '<div class="progress-fill" style="width:' + progressPercent + '%"></div>' +
      '</div>';
      
      if (sortedChallenges.length === 0) {
        return '<div class="challenges-empty">每日挑战加载中...</div>';
      }
      
      var html = '<div class="challenges-grid" data-draggable-container="true">' + headerHtml;
      
      sortedChallenges.forEach(function(challenge, index) {
        var doneClass = challenge.completed ? ' completed' : '';
        var timeStr = challenge.time ? '<span class="check-time">' + challenge.time + '</span>' : '';
        
        var progress = self.getChallengeProgress(challenge.id);
        var streakDays = progress.streak || 0;
        var streakHtml = streakDays > 0 ? '<span class="challenge-streak">🔥 ' + streakDays + '天</span>' : '';
        
        // 获取挑战等级（从进度记录或挑战配置中获取）
        var level = progress.level || challenge.level || 'F';
        var levelClass = 'challenge-level-' + level.toLowerCase();
        
        html += '<div class="challenge-card ' + doneClass + ' ' + levelClass + '" data-index="' + index + '" data-id="' + challenge.id + '">' +
          '<div class="challenge-card-border"></div>' +
          '<div class="challenge-header">' +
            '<div class="challenge-chk' + doneClass + '" data-index="' + index + '">' + (challenge.completed ? '✓' : '') + '</div>' +
            '<div class="challenge-info">' +
              '<div class="challenge-name">' + challenge.name + timeStr + streakHtml + '</div>' +
              '<div class="challenge-target">' + challenge.target + '</div>' +
              '<div class="challenge-bind">📋 ' + challenge.bindTask + ' · +' + challenge.exp + 'EXP</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      
      if (completedCount === totalCount && totalCount > 0) {
        html += '<div class="all-completed-banner">🎉 今日全勤！额外+100经验</div>';
      }
      
      html += '</div>';
      return html;
    },
    
    /**
     * 获取挑战进度
     * @param {string} challengeId - 挑战ID
     * @returns {Object} 进度对象
     */
    getChallengeProgress: function(challengeId) {
      var storage = LifeGame.core.Storage.data;
      var records = storage.dailyChallengeRecords || {};
      var record = records[challengeId] || { totalDays: 0, streak: 0, lastDate: null };
      
      // 如果没有等级，根据累计天数计算等级
      if (!record.level) {
        record.level = this.calculateLevelFromDays(record.totalDays || 0);
      }
      
      return record;
    },
    
    /**
     * 根据累计天数计算等级
     * @param {number} totalDays - 累计完成天数
     * @returns {string} 等级
     */
    calculateLevelFromDays: function(totalDays) {
      if (totalDays >= 7301) return 'SSS';
      if (totalDays >= 7300) return 'SS';
      if (totalDays >= 3650) return 'S';
      if (totalDays >= 1095) return 'A';
      if (totalDays >= 365) return 'B';
      if (totalDays >= 180) return 'C';
      if (totalDays >= 30) return 'D';
      if (totalDays >= 7) return 'E';
      return 'F';
    },
    
    /**
     * 渲染禁止事项
     * @returns {string} HTML字符串
     */
    renderForbids: function() {
      var self = this;
      
      var sortedItems = this.applyOrder(this.forbiddenItems, 'challenge_order_forbid');
      
      if (sortedItems.length === 0) {
        return '<div class="challenges-empty">禁止事项加载中...</div>';
      }
      
      var violatedCount = sortedItems.filter(function(item) { 
        return item.todayStatus === 'violated'; 
      }).length;
      var totalCount = sortedItems.length;
      var completedCount = totalCount - violatedCount;
      
      var headerHtml = '<div class="daily-progress-header">' +
        '<span class="progress-title">今日坚守</span>' +
        '<span class="progress-count">' + completedCount + '/' + totalCount + '</span>' +
      '</div>' +
      '<div class="daily-progress-bar">' +
        '<div class="progress-fill" style="width:' + (completedCount / totalCount * 100) + '%"></div>' +
      '</div>' +
      '<div class="forbid-status-summary">' +
        '<span class="status-completed">✓ 坚守 ' + completedCount + '</span>' +
        '<span class="status-violated">✗ 违规 ' + violatedCount + '</span>' +
      '</div>';
      
      var html = '<div class="forbids-header">' + headerHtml + '</div><div class="forbids-list" data-draggable-container="true">';
      
      sortedItems.forEach(function(item, index) {
        var config = self.getLevelConfig(item.level);
        var nextLevel = config ? config.next : null;
        var nextDays = nextLevel ? self.getLevelConfig(nextLevel).minDays : null;
        
        var progressText = '';
        if (nextDays) {
          progressText = ' (再' + (nextDays - item.totalDays) + '天升级)';
        } else {
          progressText = ' (已满级)';
        }
        
        var statusClass = '';
        var statusIcon = '';
        if (item.todayStatus === 'violated') {
          statusClass = ' violated';
          statusIcon = '✗';
        } else {
          statusClass = ' completed';
          statusIcon = '✓';
        }
        
        var timeStr = item.todayTime ? '<span class="check-time">' + item.todayTime + '</span>' : '';
        
        html += '<div class="forbid-card' + statusClass + ' rank-' + item.level.toLowerCase() + '" data-index="' + index + '" data-id="' + item.id + '">' +
          '<div class="forbid-header">' +
            '<div class="forbid-rank rank-' + item.level.toLowerCase() + '">' + item.level + '</div>' +
            '<div class="forbid-main">' +
              '<div class="forbid-name">' + item.name + timeStr + '</div>' +
            '</div>' +
            '<div class="forbid-status-badge ' + statusClass + '">' + statusIcon + '</div>' +
          '</div>' +
          '<div class="forbid-stats">' +
            '<span class="stat-streak">🔥 ' + item.days + '天</span>' +
            '<span class="stat-total">📅 ' + item.totalDays + '天' + progressText + '</span>' +
          '</div>' +
          '<div class="forbid-actions">' +
            '<button class="forbid-btn fail' + (item.todayStatus === 'violated' ? ' done' : '') + '" data-index="' + index + '" data-action="violate">' + (item.todayStatus === 'violated' ? '已违规' : '违规') + '</button>' +
          '</div>' +
        '</div>';
      });
      
      if (violatedCount === 0 && totalCount > 0) {
        html += '<div class="all-completed-banner">🎉 今日禁止事项全勤！明日+1骰子</div>';
      }
      
      html += '</div>';
      return html;
    },
    
    /**
     * 绑定事件
     */
    attachEvents: function() {
      var self = this;
      
      var container = document.getElementById('world-content');
      if (!container) return;
      
      if (container.dataset.challengesEventsBound === 'true') return;
      container.dataset.challengesEventsBound = 'true';
      
      this._eventHandlers = {};
      
      this._eventHandlers.click = function(e) {
        if (e.target.closest('#back-btn')) {
          LifeGame.emit('nav:back');
          return;
        }
        
        var filterBtn = e.target.closest('.challenges-header .filter-btn');
        if (filterBtn) {
          self.currentFilter = filterBtn.dataset.filter;
          self.debouncedRender();
          return;
        }
        
        var challengeChk = e.target.closest('.challenge-chk');
        if (challengeChk) {
          var index = parseInt(challengeChk.dataset.index);
          self.toggleDailyChallenge(index);
          return;
        }
        
        var challengeCard = e.target.closest('.challenge-card');
        if (challengeCard) {
          if (e.target.closest('.challenge-chk')) return;
          var index = parseInt(challengeCard.dataset.index);
          self.toggleDailyChallenge(index);
          return;
        }
        
        var forbidBtn = e.target.closest('.forbid-btn');
        if (forbidBtn) {
          var index = parseInt(forbidBtn.dataset.index);
          self.violateForbid(index);
          return;
        }
        
        var chestOpenBtn = e.target.closest('.chest-open-btn');
        if (chestOpenBtn) {
          e.stopPropagation();
          var date = chestOpenBtn.dataset.date;
          self.openDiceChest(date);
          return;
        }
        
        var chestItem = e.target.closest('.chest-item');
        if (chestItem && !e.target.closest('.chest-open-btn')) {
          var date = chestItem.dataset.date;
          self.openDiceChest(date);
          return;
        }
        
        if (e.target.closest('#open-all-chests')) {
          self.openAllDiceChests();
          return;
        }
        
        if (e.target.closest('#add-challenge-btn')) {
          self.openAddChallenge();
          return;
        }
        
        if (e.target.closest('#add-forbid-btn')) {
          self.openAddForbid();
          return;
        }
      };
      
      container.addEventListener('click', this._eventHandlers.click);
      
      this.initDragSort();
    },
    
    /**
     * 初始化拖拽排序
     */
    initDragSort: function() {
      var self = this;
      var worldContent = document.getElementById('world-content');
      if (!worldContent) {
        LifeGame.warn('[challenges] world-content 未找到');
        return;
      }
      
      var container = worldContent.querySelector('.challenges-grid, .forbids-list');
      if (!container) {
        LifeGame.warn('[challenges] 未找到拖拽容器');
        return;
      }
      
      var storageKey = 'challenge_order_' + this.currentFilter;
      var itemSelector = this.currentFilter === 'daily' ? '.challenge-card' : '.forbid-card';
      
      LifeGame.log('[challenges] 初始化拖拽:', storageKey, '选择器:', itemSelector);
      
      // 使用 DragMouse（鼠标事件模拟拖拽）
      if (window.DragMouse) {
        LifeGame.log('[challenges] 使用 DragMouse 初始化拖拽');
        window.DragMouse.init(container, itemSelector, storageKey, function(newOrder) {
          LifeGame.log('[challenges] 新排序:', newOrder);
          self.saveOrder(storageKey, newOrder);
        });
      } else if (window.DragSort) {
        var items = container.querySelectorAll(itemSelector);
        items.forEach(function(item) {
          item.draggable = true;
          item.style.cursor = 'grab';
        });
        window.DragSort.init(container, itemSelector, storageKey, function(newOrder) {
          LifeGame.log('[challenges] 新排序:', newOrder);
          self.saveOrder(storageKey, newOrder);
        });
      } else {
        LifeGame.warn('[challenges] 没有可用的拖拽库');
      }
    },
    
    /**
     * 保存排序
     * @param {string} key - 存储键
     * @param {Array} order - 排序数组
     */
    saveOrder: function(key, order) {
      LifeGame.core.Storage.set(key, order);
    },
    
    /**
     * 应用排序
     * @param {Array} items - 项目数组
     * @param {string} storageKey - 存储键
     * @returns {Array} 排序后的数组
     */
    applyOrder: function(items, storageKey) {
      var savedOrder = LifeGame.core.Storage.get(storageKey);
      if (!savedOrder || savedOrder.length === 0) return items;
      
      var ordered = [];
      var remaining = items.slice();
      
      savedOrder.forEach(function(id) {
        var idx = remaining.findIndex(function(item) {
          return item.id === id;
        });
        if (idx !== -1) {
          ordered.push(remaining[idx]);
          remaining.splice(idx, 1);
        }
      });
      
      return ordered.concat(remaining);
    },
    
    /**
     * 切换每日挑战
     * @param {number} index - 挑战索引
     */
    toggleDailyChallenge: function(index) {
      if (index < 0 || index >= this.dailyChallenges.length) return;
      
      var challenge = this.dailyChallenges[index];
      var now = new Date();
      var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      if (challenge.completed) {
        challenge.completed = false;
        challenge.time = null;
        
        if (challenge.expAwarded) {
          this.deductExp(challenge.exp);
          challenge.expAwarded = false;
          this.deductTaskExp(challenge.bindTask, challenge.exp);
        }
        
        this.todayRecords[challenge.id] = {
          completed: false,
          time: null,
          expAwarded: false
        };
        
        this.updateChallengeStreak(challenge.id, false);
        
        LifeGame.emit('challenge:cancelled', {
          challengeId: challenge.id,
          name: challenge.name
        });
      } else {
        challenge.completed = true;
        challenge.time = timeStr;
        
        this.awardExp(challenge.exp);
        challenge.expAwarded = true;
        
        this.awardTaskExp(challenge.bindTask, challenge.exp);
        
        this.todayRecords[challenge.id] = {
          completed: true,
          time: timeStr,
          expAwarded: true
        };
        
        this.updateChallengeStreak(challenge.id, true);
        
        LifeGame.emit('challenge:completed', {
          challenge: challenge,
          challengeId: challenge.id,
          name: challenge.name,
          bindTask: challenge.bindTask,
          exp: challenge.exp
        });
        
        this.checkAllCompleted();
      }
      
      this.saveDailyChallenges();
      
      LifeGame.emit('dailyChallenge:toggled', { 
        challengeId: challenge.id, 
        name: challenge.name,
        completed: challenge.completed,
        time: timeStr
      });
      
      this.debouncedRender();
    },
    
    /**
     * 发放经验
     * @param {number} amount - 经验值
     */
    awardExp: function(amount) {
      var profile = LifeGame.core.Storage.get('profile') || {};
      profile.exp = (profile.exp || 0) + amount;
      LifeGame.core.Storage.set('profile', profile);
    },
    
    /**
     * 扣除经验
     * @param {number} amount - 经验值
     */
    deductExp: function(amount) {
      var profile = LifeGame.core.Storage.get('profile') || {};
      profile.exp = Math.max(0, (profile.exp || 0) - amount);
      LifeGame.core.Storage.set('profile', profile);
      LifeGame.emit('exp:deducted', { amount: amount, source: 'dailyChallenge' });
    },
    
    /**
     * 更新挑战连续天数
     * @param {string} challengeId - 挑战ID
     * @param {boolean} isCompleted - 是否完成
     */
    updateChallengeStreak: function(challengeId, isCompleted) {
      var storage = LifeGame.core.Storage.data;
      var records = storage.dailyChallengeRecords || {};
      var today = this.getTodayStr();
      var yesterday = this.getYesterdayStr();
      
      var rec = records[challengeId] || { totalDays: 0, streak: 0, lastDate: null };
      
      if (isCompleted) {
        if (rec.lastDate === yesterday) {
          rec.streak++;
        } else if (rec.lastDate !== today) {
          rec.streak = 1;
        }
        rec.totalDays++;
        rec.lastDate = today;
      } else {
        if (rec.lastDate === today) {
          rec.totalDays = Math.max(0, rec.totalDays - 1);
          var yesterdayRec = this.getYesterdayChallengeRecord(challengeId);
          if (yesterdayRec && yesterdayRec.completed) {
            rec.streak = rec.streak > 0 ? rec.streak - 1 : 0;
          } else {
            rec.streak = 0;
          }
          rec.lastDate = yesterdayRec ? yesterdayRec.date : null;
        }
      }
      
      records[challengeId] = rec;
      storage.dailyChallengeRecords = records;
      LifeGame.core.Storage.set('dailyChallengeRecords', records);
    },
    
    /**
     * 获取昨日挑战记录
     * @param {string} challengeId - 挑战ID
     * @returns {Object|null} 记录对象
     */
    getYesterdayChallengeRecord: function(challengeId) {
      var storage = LifeGame.core.Storage.data;
      var dcData = storage.dailyChallenges || {};
      var yesterday = this.getYesterdayStr();
      var yesterdayData = dcData[yesterday];
      
      if (yesterdayData && yesterdayData[challengeId]) {
        return {
          completed: yesterdayData[challengeId].completed,
          date: yesterday
        };
      }
      return null;
    },
    
    /**
     * 给长期任务增加经验
     * @param {string} taskName - 任务名称
     * @param {number} amount - 经验值
     */
    awardTaskExp: function(taskName, amount) {
      if (!taskName) return;
      
      var tasksModule = LifeGame.getModule('tasks');
      if (tasksModule && tasksModule.addExpToLongTaskByName) {
        tasksModule.addExpToLongTaskByName(taskName, amount);
      }
    },
    
    /**
     * 扣除长期任务经验
     * @param {string} taskName - 任务名称
     * @param {number} amount - 经验值
     */
    deductTaskExp: function(taskName, amount) {
      if (!taskName) return;
      
      var tasksModule = LifeGame.getModule('tasks');
      if (tasksModule && tasksModule.deductExpFromLongTaskByName) {
        tasksModule.deductExpFromLongTaskByName(taskName, amount);
      }
    },
    
    /**
     * 检查是否全勤
     */
    checkAllCompleted: function() {
      var allCompleted = this.dailyChallenges.every(function(c) { return c.completed; });
      
      if (allCompleted) {
        var storage = LifeGame.core.Storage.data;
        var dcData = storage.dailyChallenges || {};
        var todayData = dcData[this.getTodayStr()] || {};
        
        if (!todayData.bonusAwarded) {
          this.awardExp(100);
          todayData.bonusAwarded = true;
          dcData[this.getTodayStr()] = todayData;
          LifeGame.core.Storage.set('dailyChallenges', dcData);
          
          this.showAllCompletedAnimation();
          
          LifeGame.emit('dailyChallenge:allCompleted', { bonus: 100 });
        }
      }
    },
    
    /**
     * 显示全勤动画
     */
    showAllCompletedAnimation: function() {
      var self = this;
      var container = document.getElementById('app');
      if (!container) return;
      
      var overlay = document.createElement('div');
      overlay.className = 'all-completed-overlay';
      overlay.innerHTML = [
        '<div class="all-completed-animation">',
          '<div class="celebration-icon">🎉</div>',
          '<h2>今日全勤！</h2>',
          '<p>已完成全部10项挑战</p>',
          '<div class="bonus-text">+100 EXP</div>',
          '<button class="confirm-btn">太棒了！</button>',
        '</div>'
      ].join('');
      
      container.appendChild(overlay);
      
      overlay.querySelector('.confirm-btn').addEventListener('click', function() {
        overlay.remove();
      });
      
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 3000);
    },
    
    /**
     * 违反禁止事项
     * @param {number} index - 索引
     */
    violateForbid: function(index) {
      if (index < 0 || index >= this.forbiddenItems.length) return;
      
      var item = this.forbiddenItems[index];
      var self = this;
      
      if (item.todayStatus === 'violated') {
        alert('今日已记录违规');
        return;
      }
      
      var now = new Date();
      var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      var isHighLevel = ['S', 'SS', 'SSS'].indexOf(item.level) >= 0;
      var penaltyText = isHighLevel 
        ? '【' + item.name + '】' + item.level + '级破戒\n惩罚：保持等级，但累计天数清零！'
        : '【' + item.name + '】破戒\n惩罚：掉到F级，连续天数清零！';
      
      var confirmMsg = penaltyText + '\n\n确定记录违规？';
      
      if (item.protectionCards > 0) {
        confirmMsg += '\n\n（您有 ' + item.protectionCards + ' 张保护卡可抵消惩罚）';
      }
      
      if (!confirm(confirmMsg)) {
        return;
      }
      
      var reason = prompt('记录违规原因（可选）：', '');
      
      if (item.protectionCards > 0) {
        var useCard = confirm('是否使用 1 张保护卡抵消本次破戒惩罚？\n当前拥有：' + item.protectionCards + ' 张\n\n点击"确定"使用保护卡\n点击"取消"接受惩罚');
        if (useCard) {
          item.protectionCards--;
          
          item.history.push({
            date: this.getTodayStr(),
            status: 'protected',
            reason: reason || '使用保护卡抵消违规',
            time: timeStr
          });
          
          this.saveForbidRecords();
          this.saveForbiddenItems();
          
          alert('🛡️ 保护卡已使用，本次违规已抵消');
          this.debouncedRender();
          return;
        }
      }
      
      item.todayStatus = 'violated';
      item.todayTime = timeStr;
      item.todayReason = reason || '';
      
      if (item.days > (item.maxStreak || 0)) {
        item.maxStreak = item.days;
      }
      
      item.days = 0;
      item.totalDays = 0;
      
      if (!isHighLevel) {
        item.level = 'F';
      }
      
      item.history.push({
        date: this.getTodayStr(),
        status: 'violated',
        reason: reason || '',
        time: timeStr
      });
      
      this.forbidTodayRecords[item.id] = {
        status: 'violated',
        time: timeStr,
        reason: reason || ''
      };
      this.saveForbidRecords();
      this.saveForbiddenItems();
      
      LifeGame.emit('forbid:violated', { 
        name: item.name,
        reason: reason || ''
      });
      
      this.debouncedRender();
    },
    
    /**
     * 获取等级配置
     * @param {string} rank - 等级
     * @returns {Object} 配置对象
     */
    getLevelConfig: function(rank) {
      return LEVEL_CONFIG[rank] || LEVEL_CONFIG['F'];
    },
    
    /**
     * 打开添加每日挑战表单
     * 必须关联长期任务才能保存
     */
    openAddChallenge: function() {
      var self = this;
      
      // 获取长期任务列表
      var tasks = LifeGame.core.Storage.get('tasks') || [];
      var longTasks = tasks.filter(function(t) { 
        return t.period === 'long' || t.period === 'longterm'; 
      });
      
      if (longTasks.length === 0) {
        alert('没有可用的长期任务！请先创建长期任务。');
        return;
      }
      
      // 使用 NavController 显示子页面
      if (window.NavController && NavController.showSubPage) {
        NavController.showSubPage(function(container) {
          self.renderAddChallengeForm(container, longTasks);
        });
      } else {
        var container = document.getElementById('world-content') || document.getElementById('app');
        if (container) this.renderAddChallengeForm(container, longTasks);
      }
    },
    
    /**
     * 渲染添加每日挑战表单
     * @param {HTMLElement} container - 容器
     * @param {Array} longTasks - 长期任务列表
     */
    renderAddChallengeForm: function(container, longTasks) {
      var self = this;
      
      // 等级颜色
      var gradeColors = {
        'F': '#9ca3af', 'E': '#a0826d', 'D': '#60a5fa', 'C': '#4ade80',
        'B': '#c084fc', 'A': '#fbbf24', 'S': '#f87171', 'SS': '#f59e0b', 'SSS': '#fcd34d'
      };
      
      // 生成长期任务选项
      var taskOptionsHtml = longTasks.map(function(t) {
        var gradeColor = gradeColors[t.diff] || '#9ca3af';
        return '<option value="' + t.id + '">' + t.n + ' (' + (t.diff || 'F') + '级)</option>';
      }).join('');
      
      container.innerHTML = 
        '<div class="challenge-form-page">' +
          '<div class="challenge-form-header">' +
            '<h3>➕ 添加每日挑战</h3>' +
            '<p class="form-hint">每日挑战必须关联长期任务，完成后会为长期任务增加经验</p>' +
          '</div>' +
          '<div class="challenge-form-content">' +
            '<div class="form-group">' +
              '<label>挑战名称 *</label>' +
              '<input type="text" id="challenge-name" placeholder="例如：晨跑5公里" maxlength="50">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>目标描述 *</label>' +
              '<input type="text" id="challenge-target" placeholder="例如：每天早上跑步5公里" maxlength="100">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>关联长期任务 *</label>' +
              '<select id="challenge-bind-task">' +
                '<option value="">请选择长期任务...</option>' +
                taskOptionsHtml +
              '</select>' +
              '<span class="field-hint">必须选择一个长期任务，挑战完成时会为其增加经验</span>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>初始等级</label>' +
              '<select id="challenge-grade">' +
                '<option value="F" selected>F级 - 初心</option>' +
                '<option value="E">E级 - 学徒</option>' +
                '<option value="D">D级 - 熟练</option>' +
                '<option value="C">C级 - 进阶</option>' +
                '<option value="B">B级 - 专家</option>' +
                '<option value="A">A级 - 大师</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>每日经验奖励</label>' +
              '<input type="number" id="challenge-exp" value="1" min="1" max="100">' +
            '</div>' +
          '</div>' +
          '<div class="challenge-form-actions">' +
            '<button class="cancel-btn" id="cancel-challenge">取消</button>' +
            '<button class="save-btn" id="save-challenge">保存</button>' +
          '</div>' +
        '</div>';
      
      // 绑定事件
      document.getElementById('cancel-challenge').addEventListener('click', function() {
        if (window.NavController && NavController.popFromNavStack) {
          NavController.popFromNavStack();
        } else {
          self.render(document.getElementById('world-content'));
        }
      });
      
      document.getElementById('save-challenge').addEventListener('click', function() {
        self.saveNewChallenge();
      });
    },
    
    /**
     * 保存新的每日挑战
     */
    saveNewChallenge: function() {
      var name = document.getElementById('challenge-name').value.trim();
      var target = document.getElementById('challenge-target').value.trim();
      var bindTaskId = document.getElementById('challenge-bind-task').value;
      var grade = document.getElementById('challenge-grade').value;
      var exp = parseInt(document.getElementById('challenge-exp').value) || 1;
      
      // 验证
      if (!name) {
        alert('请输入挑战名称！');
        return;
      }
      if (!target) {
        alert('请输入目标描述！');
        return;
      }
      if (!bindTaskId) {
        alert('必须选择一个长期任务！每日挑战必须关联长期任务。');
        return;
      }
      
      // 获取绑定的任务名称
      var tasks = LifeGame.core.Storage.get('tasks') || [];
      var bindTask = tasks.find(function(t) { return t.id === bindTaskId; });
      var bindTaskName = bindTask ? bindTask.n : '';
      
      // 创建新挑战
      var newChallenge = {
        id: 'dc_' + Date.now(),
        name: name,
        target: target,
        bindTask: bindTaskName,
        bindTaskId: bindTaskId,
        level: grade,
        exp: exp,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      // 添加到挑战列表
      this.dailyChallenges.push(newChallenge);
      
      // 保存到存储
      var storage = LifeGame.core.Storage.data;
      if (!storage.dailyChallenges) storage.dailyChallenges = {};
      if (!storage.dailyChallenges.custom) storage.dailyChallenges.custom = [];
      storage.dailyChallenges.custom.push(newChallenge);
      LifeGame.core.Storage.set('dailyChallenges', storage.dailyChallenges);
      
      alert('✅ 每日挑战添加成功！');
      
      // 返回
      var self = this;
      if (window.NavController && NavController.popFromNavStack) {
        NavController.popFromNavStack(function() {
          var container = document.getElementById('world-content');
          if (container) self.render(container);
        });
      } else {
        var container = document.getElementById('world-content') || document.getElementById('app');
        if (container) this.render(container);
      }
    },
    
    /**
     * 打开添加禁止事项表单
     */
    openAddForbid: function() {
      alert('添加禁止事项功能开发中...');
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, ChallengesModule);
})();
