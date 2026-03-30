/**
 * LifeGame v2.0 - Main Bootstrap
 * Application initialization and startup
 */

(function() {
  'use strict';
  
  console.log('====================================');
  console.log('LifeGame v2.0 启动中...');
  console.log('====================================');
  
  var Main = {
    init: function() {
      console.log('[Main] 开始初始化...');
      
      // Initialize in order
      this.initCore();
      this.initModules();
      
      console.log('[Main] 应用启动完成！');
      LifeGame.emit('app:ready');
      
      // 新导航系统：由 NavController 处理初始视图
      // 不要在这里直接调用 world-selector
    },
    
    initCore: function() {
      console.log('[Main] 初始化核心系统...');
      
      // Storage must be first
      if (LifeGame.core.Storage) {
        LifeGame.core.Storage.init();
      } else {
        console.error('[Main] Storage 核心未找到');
      }
      
      // Renderer
      if (LifeGame.core.Renderer) {
        LifeGame.core.Renderer.init();
      } else {
        console.error('[Main] Renderer 核心未找到');
      }
      
      // Affinity Manager
      if (LifeGame.core.AffinityManager) {
        LifeGame.core.AffinityManager.init();
      } else {
        console.error('[Main] AffinityManager 核心未找到');
      }
      
      // Loading Manager
      if (LifeGame.getModule('loading-manager')) {
        LifeGame.getModule('loading-manager').init();
      } else {
        console.warn('[Main] LoadingManager 未找到');
      }
      
      // Undo Manager
      if (LifeGame.getModule('undo-manager')) {
        LifeGame.getModule('undo-manager').init();
      } else {
        console.warn('[Main] UndoManager 未找到');
      }
    },
    
    initModules: function() {
      console.log('[Main] 初始化所有模块...');
      
      var moduleNames = [
        'world-selector',
        'overview',
        'action',
        'tasks',
        'challenges',
        'profile',
        'guide',
        'history',
        'stats',
        'idle',
        'inventory',
        'shop',
        'town',
        'settings'
      ];
      
      moduleNames.forEach(function(name) {
        var module = LifeGame.getModule(name);
        if (module && module.init) {
          try {
            module.init();
          } catch (e) {
            console.error('[Main] 模块 "' + name + '" 初始化失败:', e);
          }
        } else {
          console.warn('[Main] 模块 "' + name + '" 未注册或没有 init 方法');
        }
      });
      
      // 应用用户设置的时间栏颜色
      var settingsModule = LifeGame.getModule('settings');
      if (settingsModule && settingsModule.applyTimebarColor) {
        settingsModule.applyTimebarColor();
      }
      
      // 应用用户设置的统计页面风格
      if (settingsModule && settingsModule.applyStatsStyle) {
        settingsModule.applyStatsStyle();
      }
    }
  };
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      Main.init();
    });
  } else {
    // DOM already ready
    Main.init();
  }
})();
