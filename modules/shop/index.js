/**
 * Shop Module - 商店系统
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'shop';
  
  var ShopModule = {
    init: function() {
      LifeGame.log('[shop] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:shop', function(data) {
        var module = LifeGame.getModule('shop');
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
            '<h2 style="font-size:18px;font-weight:700;color:var(--text);flex:1;">🏪 商店</h2>' +
          '</div>' +
          '<div style="padding:40px;text-align:center;">' +
            '<div style="font-size:64px;margin-bottom:20px;">🏪</div>' +
            '<p style="color:#94a3b8;">用碎片兑换技能</p>' +
          '</div>' +
        '</div>';
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, ShopModule);
})();
