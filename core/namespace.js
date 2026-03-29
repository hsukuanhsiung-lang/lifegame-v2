/**
 * LifeGame v2.0 - Namespace & Module System
 * Core namespace with event-driven architecture
 */

(function() {
  'use strict';
  
  window.LifeGame = {
    // Debug mode - 开发环境开启，生产环境关闭
    DEBUG: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    
    // Module registry
    modules: {},
    
    // Event system
    events: {},
    
    // Core systems container
    core: {},
    
    // Debug logger - 只在 DEBUG 模式下输出
    log: function() {
      if (this.DEBUG && console) {
        console.log.apply(console, arguments);
      }
    },
    warn: function() {
      if (this.DEBUG && console) {
        console.warn.apply(console, arguments);
      }
    },
    error: function() {
      // 错误始终输出
      if (console) {
        console.error.apply(console, arguments);
      }
    },
    
    // Data defaults
    data: {
      defaultState: {
        currentWorld: null,
        currentView: null,
        tasks: [],
        forbids: [],
        dailyRecords: {},
        profile: {
          name: 'Player',
          level: 1,
          exp: 0,
          world: 'surface'
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    },
    
    /**
     * Register a module
     */
    register: function(name, module) {
      if (this.modules[name]) {
        LifeGame.warn('[LifeGame] 模块 "' + name + '" 已存在，跳过注册');
        return;
      }
      
      this.modules[name] = module;
      this.log('[LifeGame] 模块 "' + name + '" 注册成功');
    },
    
    /**
     * Register a module (alias for register)
     */
    registerModule: function(name, module) {
      return this.register(name, module);
    },
    
    /**
     * Get a registered module
     */
    getModule: function(name) {
      return this.modules[name];
    },
    
    /**
     * Publish an event
     */
    emit: function(event, data) {
      this.log('[LifeGame] 事件触发:', event, data);
      
      if (this.events[event]) {
        this.events[event].forEach(function(callback) {
          try {
            callback(data);
          } catch (e) {
            LifeGame.error('[LifeGame] 事件处理错误:', event, e);
          }
        });
      }
    },
    
    /**
     * Subscribe to an event
     * @returns {Function} 取消订阅的函数
     */
    on: function(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
      
      // 返回取消订阅的函数
      var self = this;
      return function() {
        self.off(event, callback);
      };
    },
    
    /**
     * Unsubscribe from an event
     */
    off: function(event, callback) {
      if (!this.events[event]) return;
      
      var index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
      
      // 清理空数组，防止内存泄漏
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    },
    
    /**
     * Subscribe to an event once
     */
    once: function(event, callback) {
      var self = this;
      var onceWrapper = function(data) {
        self.off(event, onceWrapper);
        callback(data);
      };
      this.on(event, onceWrapper);
    }
  };
  
  LifeGame.log('[LifeGame] v2.0 命名空间已初始化');
})();
