/**
 * LifeGame v2.0 - Renderer System
 * View rendering and transitions
 */

(function() {
  'use strict';
  
  LifeGame.core.Renderer = {
    container: null,
    currentView: null,
    currentWorld: null,
    _eventsBound: false,
    _listeners: [], // 存储监听器引用以便清理
    
    init: function() {
      LifeGame.log('[Renderer] 初始化...');
      this.container = document.getElementById('app');
      
      if (!this.container) {
        console.error('[Renderer] 找不到 #app 容器');
        return;
      }
      
      // 防止重复绑定事件
      if (!this._eventsBound) {
        this.bindEvents();
        this._eventsBound = true;
      }
      
      LifeGame.log('[Renderer] 初始化完成');
    },
    
    bindEvents: function() {
      var self = this;
      
      // 创建并存储监听器引用
      var viewListeners = [
        { event: 'view:tasks', handler: function(data) { self.switchView('tasks', data); } },
        { event: 'view:challenges', handler: function(data) { self.switchView('challenges', data); } },
        { event: 'view:timeline', handler: function(data) { self.switchView('timeline', data); } },
        { event: 'view:profile', handler: function(data) { self.switchView('profile', data); } },
        { event: 'view:guide', handler: function(data) { self.switchView('guide', data); } },
        { event: 'view:shop', handler: function(data) { self.switchView('shop', data); } },
        { event: 'view:town', handler: function(data) { self.switchView('town', data); } },
        { event: 'view:idle', handler: function(data) { self.switchView('idle', data); } },
        { event: 'view:inventory', handler: function(data) { self.switchView('inventory', data); } }
      ];
      
      viewListeners.forEach(function(item) {
        LifeGame.on(item.event, item.handler);
        self._listeners.push(item);
      });
      
      // Listen for world selection
      var worldHandler = function(data) {
        LifeGame.log('[Renderer] 世界已选择:', data.world);
        self.currentWorld = data.world;
        LifeGame.log('[Renderer] 世界选择，由 NavController 处理');
      };
      LifeGame.on('world:selected', worldHandler);
      self._listeners.push({ event: 'world:selected', handler: worldHandler });
    },
    
    // 清理方法：移除所有事件监听器
    destroy: function() {
      var self = this;
      this._listeners.forEach(function(item) {
        LifeGame.off(item.event, item.handler);
      });
      this._listeners = [];
      this._eventsBound = false;
      LifeGame.log('[Renderer] 已清理所有事件监听器');
    },
    
    switchView: function(viewName, data) {
      LifeGame.log('[Renderer] 切换视图:', viewName);
      
      this.currentView = viewName;
      
      // Get the module responsible for this view
      var module = LifeGame.getModule(viewName);
      if (module && module.render) {
        module.render();
      } else {
        LifeGame.warn('[Renderer] 模块 "' + viewName + '" 没有 render 方法');
        this.renderPlaceholder(viewName);
      }
      
      // Notify nav to update
      LifeGame.emit('view:changed', { view: viewName });
    },
    
    renderPlaceholder: function(viewName) {
      var titles = {
        'tasks': '任务系统',
        'challenges': '挑战系统',
        'timeline': '时间轴',
        'profile': '角色档案',
        'guide': '攻略指南',
        'shop': '商店',
        'town': '城镇',
        'idle': '挂机系统',
        'inventory': '背包'
      };
      
      this.container.innerHTML = 
        '<div style="padding:40px;text-align:center;color:#64748b;">' +
          '<div style="font-size:48px;margin-bottom:16px;">🚧</div>' +
          '<div style="font-size:18px;margin-bottom:8px;">' + (titles[viewName] || viewName) + '</div>' +
          '<div>模块正在开发中...</div>' +
        '</div>';
    },
    
    getContainer: function() {
      return this.container;
    }
  };
})();
