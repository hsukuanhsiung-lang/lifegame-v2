/**
 * World Selector Module - 世界选择器（重写版）
 * 包含：表世界冰霜蓝晶、里世界彩虹奥术、下线暗影血月
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'world-selector';
  
  var WorldSelector = {
    init: function() {
      LifeGame.log('[world-selector] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('nav:showWorldSelector', function() {
        self.render();
      });
    },
    
    render: function() {
      var container = document.getElementById('app');
      if (!container) return;
      
      // 隐藏导航栏
      var navBar = document.getElementById('nav-bar');
      if (navBar) navBar.style.display = 'none';
      
      container.innerHTML = 
        '<div class="world-select-container">' +
          '<div class="world-header">' +
            '<h1>🎮 Life Game</h1>' +
            '<p>选择你的世界</p>' +
          '</div>' +
          '<div class="world-grid">' +
            // 表世界 - 冰霜蓝晶
            '<div class="surface">' +
              '<div class="world-card" data-world="surface">' +
                '<div class="card-content">' +
                  '<div class="magic-circle-container">' +
                    '<div class="ring ring-2"></div>' +
                    '<div class="ring ring-1"></div>' +
                    '<div class="magic-core">🌍</div>' +
                  '</div>' +
                  '<div class="world-name">表世界</div>' +
                  '<div class="world-desc">"冰霜覆盖的现实维度"</div>' +
                  '<div class="world-features">' +
                    '<span class="feature-tag">⚡ 行动</span>' +
                    '<span class="feature-tag">📋 任务</span>' +
                    '<span class="feature-tag">📅 时间轴</span>' +
                  '</div>' +
                  '<button class="enter-btn">❄️ 进入冰域 ❄️</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // 里世界 - 彩虹奥术
            '<div class="inner">' +
              '<div class="world-card" data-world="inner">' +
                '<div class="card-content">' +
                  '<div class="magic-circle-container">' +
                    '<div class="square-ring square-4"></div>' +
                    '<div class="square-ring square-3"></div>' +
                    '<div class="square-ring square-2"></div>' +
                    '<div class="square-ring square-1"></div>' +
                    '<div class="magic-core">🏰</div>' +
                  '</div>' +
                  '<div class="world-name">里世界</div>' +
                  '<div class="world-desc">"无限领域的元素融合"</div>' +
                  '<div class="world-features">' +
                    '<span class="feature-tag">💎 进化</span>' +
                    '<span class="feature-tag">⚔️ 战斗</span>' +
                    '<span class="feature-tag">🔮 探索</span>' +
                  '</div>' +
                  '<button class="enter-btn">🌈 进入无限 🌈</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // 下线 - 暗影血月
            '<div class="offline">' +
              '<div class="world-card" data-world="offline">' +
                '<div class="card-content">' +
                  '<div class="magic-circle-container">' +
                    '<div class="magic-ring ring-3"></div>' +
                    '<div class="magic-ring ring-2"></div>' +
                    '<div class="magic-ring ring-1"></div>' +
                    '<div class="magic-core">⚔️</div>' +
                  '</div>' +
                  '<div class="world-name">下线</div>' +
                  '<div class="world-desc">"血月之下的暗影试炼"</div>' +
                  '<div class="world-features">' +
                    '<span class="feature-tag">😴 挂机</span>' +
                    '<span class="feature-tag">⚔️ 自动战斗</span>' +
                    '<span class="feature-tag">🎁 收益</span>' +
                  '</div>' +
                  '<button class="enter-btn">🌙 进入暗影 🌙</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      // 绑定点击事件（使用一次性标志防止重复绑定）
      var self = this;
      var worldGrid = document.querySelector('.world-grid');
      if (worldGrid && !worldGrid._clickBound) {
        worldGrid._clickBound = true;
        worldGrid.addEventListener('click', function(e) {
          var card = e.target.closest('.world-card');
          if (card) {
            var world = card.dataset.world;
            self.selectWorld(world);
          }
        });
      }
    },
    
    selectWorld: function(world) {
      LifeGame.log('[world-selector] 选择世界:', world);
      
      // 保存选择
      LifeGame.core.Storage.set('currentWorld', world);
      
      // 显示导航栏
      var navBar = document.getElementById('nav-bar');
      if (navBar) navBar.style.display = 'flex';
      
      // 触发世界选择事件
      LifeGame.emit('world:selected', { world: world });
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, WorldSelector);
})();
