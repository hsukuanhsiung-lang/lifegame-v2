/**
 * Inventory Module - 背包系统
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'inventory';
  
  var InventoryModule = {
    init: function() {
      LifeGame.log('[inventory] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:inventory', function(data) {
        var module = LifeGame.getModule('inventory');
        if (module) module.render();
      });
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('app');
      }
      if (!container) return;
      
      container.innerHTML = 
        '<div>' +
          '<div class="page-header" style="display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--card-border);">' +
            '<button onclick="LifeGame.emit(\'nav:back\')" style="padding:8px 14px;background:var(--card);border:1px solid var(--card-border);border-radius:8px;color:var(--text);font-size:14px;cursor:pointer;">← 返回</button>' +
            '<h2 style="font-size:18px;font-weight:700;color:var(--text);flex:1;">🎒 背包</h2>' +
          '</div>' +
          '<div style="padding:40px;text-align:center;">' +
            '<div style="font-size:64px;margin-bottom:20px;">🎒</div>' +
            '<p style="color:#94a3b8;">存储挂机获得的碎片和道具</p>' +
          '<div style="margin-top:40px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:20px;">' +
            '<div style="padding:20px;background:var(--card);border-radius:12px;">' +
              '<div style="font-size:32px;margin-bottom:8px;">💎</div>' +
              '<div>白色碎片</div>' +
              '<div style="color:#94a3b8;font-size:12px;">x0</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, InventoryModule);
})();
