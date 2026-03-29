/**
 * LifeGame v2.0 - Storage System
 * Data persistence with LocalStorage
 */

(function() {
  'use strict';
  
  var STORAGE_KEY = 'lifegame_v2_data';
  
  LifeGame.core.Storage = {
    data: null,
    
    init: function() {
      LifeGame.log('[Storage] 初始化...');
      this.data = this.load();
      LifeGame.log('[Storage] 数据加载完成，任务数:', (this.data.tasks || []).length);
      LifeGame.emit('storage:ready');
    },
    
    load: function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          var parsed = JSON.parse(saved);
          // Ensure arrays are actually arrays (fix corrupted data)
          if (parsed.tasks && !Array.isArray(parsed.tasks)) parsed.tasks = [];
          if (parsed.forbids && !Array.isArray(parsed.forbids)) parsed.forbids = [];
          if (parsed.dailyRecords && typeof parsed.dailyRecords !== 'object') parsed.dailyRecords = {};
          // Merge with defaults to ensure all fields exist
          return this.mergeDefaults(parsed, LifeGame.data.defaultState);
        }
      } catch (e) {
        LifeGame.error('[Storage] 加载失败:', e);
      }
      return JSON.parse(JSON.stringify(LifeGame.data.defaultState));
    },
    
    save: function() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        LifeGame.emit('storage:changed', this.data);
        return true;
      } catch (e) {
        LifeGame.error('[Storage] 保存失败:', e);
        return false;
      }
    },
    
    get: function(key) {
      return this.data[key];
    },
    
    set: function(key, value) {
      this.data[key] = value;
      this.save();
    },
    
    getData: function() {
      return this.data;
    },
    
    mergeDefaults: function(data, defaults, depth, seen) {
      // 防止无限递归：最大深度10层
      depth = depth || 0;
      if (depth > 10) {
        LifeGame.warn('[Storage] mergeDefaults 达到最大深度限制');
        return data;
      }
      
      // 防止循环引用
      seen = seen || new WeakSet();
      if (defaults && typeof defaults === 'object') {
        if (seen.has(defaults)) {
          LifeGame.warn('[Storage] mergeDefaults 检测到循环引用');
          return data;
        }
        seen.add(defaults);
      }
      
      var result = {};
      for (var key in defaults) {
        if (!defaults.hasOwnProperty(key)) continue;
        if (data && data[key] !== undefined) {
          if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
            result[key] = this.mergeDefaults(data[key], defaults[key], depth + 1, seen);
          } else {
            result[key] = data[key];
          }
        } else {
          result[key] = JSON.parse(JSON.stringify(defaults[key]));
        }
      }
      return result;
    },
    
    reset: function() {
      this.data = JSON.parse(JSON.stringify(LifeGame.data.defaultState));
      this.save();
      LifeGame.log('[Storage] 数据已重置');
    }
  };
})();
