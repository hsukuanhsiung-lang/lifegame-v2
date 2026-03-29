/**
 * Core Utilities - 公共工具函数
 * 提取各模块中重复定义的工具函数
 */

(function() {
  'use strict';
  
  // 检查 LifeGame 是否存在
  if (typeof LifeGame === 'undefined') {
    console.error('[Utils] LifeGame 未定义');
    return;
  }
  
  // 确保 LifeGame.core 存在
  if (!LifeGame.core) {
    LifeGame.core = {};
  }
  
  LifeGame.core.Utils = {
    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     */
    getTodayStr: function() {
      var d = new Date();
      return d.getFullYear() + '-' + 
             String(d.getMonth() + 1).padStart(2, '0') + '-' + 
             String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 获取昨天的日期字符串
     */
    getYesterdayStr: function() {
      var d = new Date();
      d.setDate(d.getDate() - 1);
      return d.getFullYear() + '-' + 
             String(d.getMonth() + 1).padStart(2, '0') + '-' + 
             String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 获取指定偏移天数的日期字符串
     * @param {number} offset - 天数偏移（负数表示过去）
     */
    getDateStr: function(offset) {
      var d = new Date();
      d.setDate(d.getDate() + offset);
      return d.getFullYear() + '-' + 
             String(d.getMonth() + 1).padStart(2, '0') + '-' + 
             String(d.getDate()).padStart(2, '0');
    },
    
    /**
     * 格式化日期显示
     * @param {string} dateStr - YYYY-MM-DD 格式
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
     * 防抖函数
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间(ms)
     */
    debounce: function(fn, delay) {
      var timer = null;
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
          fn.apply(context, args);
        }, delay);
      };
    },
    
    /**
     * 节流函数
     * @param {Function} fn - 要执行的函数
     * @param {number} limit - 限制时间(ms)
     */
    throttle: function(fn, limit) {
      var inThrottle = false;
      return function() {
        var context = this;
        var args = arguments;
        if (!inThrottle) {
          fn.apply(context, args);
          inThrottle = true;
          setTimeout(function() {
            inThrottle = false;
          }, limit);
        }
      };
    },
    
    /**
     * 生成唯一ID
     */
    generateId: function(prefix) {
      return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     */
    deepClone: function(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };
  
})();
