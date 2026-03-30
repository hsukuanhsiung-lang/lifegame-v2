/**
 * LifeGame v2.0 - Navigation Controller
 * 管理世界切换、页面导航、返回按钮等
 */

(function() {
  'use strict';
  
  // 世界配置
  // 注意：概览(overview)作为默认视图，不在二级标签页中显示
  var worldConfig = {
    surface: {
      name: '表世界',
      icon: '🌍',
      color: '#38bdf8',
      defaultView: 'overview',
      subViews: [
        { view: 'action', label: '行动', icon: '⚡' },
        { view: 'challenges', label: '挑战', icon: '🔥' },
        { view: 'tasks', label: '任务', icon: '📋' },
        { view: 'history', label: '历史', icon: '📜' },
        { view: 'settings', label: '设置', icon: '⚙️' }
      ]
    },
    inner: {
      name: '里世界',
      icon: '🏰',
      color: '#a855f7',
      defaultView: 'profile',
      subViews: [
        { view: 'profile', label: '角色', icon: '⚔️' },
        { view: 'shop', label: '商店', icon: '🏪' },
        { view: 'town', label: '城镇', icon: '🏰' }
      ]
    },
    offline: {
      name: '下线',
      icon: '⚔️',
      color: '#22c55e',
      defaultView: 'idle',
      subViews: [
        { view: 'inventory', label: '背包', icon: '🎒' }
      ]
    }
  };
  
  // 当前状态
  var currentWorld = null;
  var currentSubView = null;
  var navStack = []; // 导航栈，用于返回上一级
  
  // 暴露 currentSubView 到 window，供其他模块检查当前视图
  Object.defineProperty(window, 'currentSubView', {
    get: function() { return currentSubView; },
    set: function(val) { currentSubView = val; },
    configurable: true
  });
  
  // 导航控制器
  var NavController = {
    init: function() {
      LifeGame.log('[NavController] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      
      // 监听世界选择（从 world-selector 模块）
      LifeGame.on('world:selected', function(data) {
        LifeGame.log('[NavController] 选择世界:', data.world);
        self.enterWorld(data.world);
      });
      
      // 监听返回世界选择
      LifeGame.on('nav:backToWorlds', function() {
        LifeGame.log('[NavController] 返回世界选择');
        self.showWorldSelector();
      });
      
      // 监听页面跳转（从概览页等）
      LifeGame.on('nav:switch', function(data) {
        LifeGame.log('[NavController] 跳转到:', data.view, data.subView);
        if (data.view) {
          // 更新标签激活状态
          document.querySelectorAll('.sub-nav-item').forEach(function(item) {
            item.classList.remove('active');
            if (item.dataset.view === data.view) {
              item.classList.add('active');
            }
          });
          // 切换视图，传递 subView 选项
          var options = data.subView ? { subView: data.subView } : null;
          self.switchSubView(data.view, false, options);
        }
      });
    },
    
    // 显示世界选择页面（第一层）- 新版带魔法阵
    showWorldSelector: function() {
      currentWorld = null;
      window.currentSubView = null;
      
      // 停止时钟更新
      this.stopClock();
      
      // 清除存储的当前世界（防止有问题的视图被强制恢复）
      LifeGame.core.Storage.set('currentWorld', null);
      LifeGame.log('[NavController] 已清除 currentWorld，下次进入将显示世界选择器');
      
      var container = document.getElementById('app');
      container.innerHTML = 
        '<div class="world-select-container">' +
          '<div class="world-header">' +
            '<h1>🎮 Life Game</h1>' +
            '<p>选择你的世界</p>' +
          '</div>' +
          '<div class="world-grid">' +
            // 第一行：表世界 + 里世界
            '<div class="world-row">' +
              // 表世界
              '<div class="surface">' +
                '<div class="world-card" data-world="surface">' +
                  '<div class="card-content">' +
                    '<div class="magic-circle-container">' +
                      '<div class="ring ring-2"></div>' +
                      '<div class="ring ring-1"></div>' +
                      '<div class="magic-core">🌍</div>' +
                    '</div>' +
                    '<div class="world-name">表世界</div>' +
                    '<div class="world-desc">管理现实中的任务与挑战</div>' +
                    '<div class="world-features">' +
                      '<span class="feature-tag">⚡ 行动</span>' +
                      '<span class="feature-tag">📋 任务</span>' +
                      '<span class="feature-tag">📅 时间轴</span>' +
                    '</div>' +
                    '<button class="enter-btn">进入现实</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // 里世界
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
                    '<div class="world-desc">探索游戏世界，进化你的角色</div>' +
                    '<div class="world-features">' +
                      '<span class="feature-tag">💎 进化</span>' +
                      '<span class="feature-tag">⚔️ 战斗</span>' +
                      '<span class="feature-tag">🔮 探索</span>' +
                    '</div>' +
                    '<button class="enter-btn">进入游戏</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // 第二行：下线单独居中
            '<div class="world-row offline-row">' +
              '<div class="offline">' +
                '<div class="world-card" data-world="offline">' +
                  '<div class="card-content">' +
                    // 左侧：名称和描述
                    '<div class="world-info">' +
                      '<div class="world-name">下线</div>' +
                      '<div class="world-desc">休息挂机，自动获取资源</div>' +
                    '</div>' +
                    // 中间：emoji和魔法圈
                    '<div class="magic-circle-container">' +
                      '<div class="magic-ring ring-3"></div>' +
                      '<div class="magic-ring ring-2"></div>' +
                      '<div class="magic-ring ring-1"></div>' +
                      '<div class="magic-core">⚔️</div>' +
                    '</div>' +
                    // 右侧：标签和按钮
                    '<div class="world-actions">' +
                      '<div class="world-features">' +
                        '<span class="feature-tag">😴 挂机</span>' +
                        '<span class="feature-tag">⚔️ 自动战斗</span>' +
                        '<span class="feature-tag">🎁 收益</span>' +
                      '</div>' +
                      '<button class="enter-btn">确认下线</button>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      // 绑定点击事件
      var self = this;
      container.querySelectorAll('.world-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var world = this.dataset.world;
          LifeGame.emit('world:selected', { world: world });
        });
      });
    },
    
    // 格式化时间显示
    formatTime: function() {
      var now = new Date();
      var hours = String(now.getHours()).padStart(2, '0');
      var minutes = String(now.getMinutes()).padStart(2, '0');
      return hours + ':' + minutes;
    },
    
    // 格式化日期显示
    formatDate: function() {
      var now = new Date();
      var months = now.getMonth() + 1;
      var days = now.getDate();
      var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      var weekday = weekdays[now.getDay()];
      return months + '月' + days + '日 ' + weekday;
    },
    
    // 计算 Day X（从数据中获取或默认）
    getDayNumber: function() {
      var profile = LifeGame.core.Storage.get('profile') || {};
      return profile.day || 1;
    },
    
    // 更新时间显示
    updateTimeDisplay: function() {
      var timeEl = document.getElementById('time-main');
      var dateEl = document.getElementById('time-date');
      
      if (timeEl) {
        var timeStr = this.formatTime();
        var timeParts = timeStr.split(':');
        // 保持结构，只更新时分
        var hSpan = timeEl.querySelector('.time-h');
        var mSpan = timeEl.querySelector('.time-m');
        if (hSpan) hSpan.textContent = timeParts[0];
        if (mSpan) mSpan.textContent = timeParts[1];
      }
      
      if (dateEl) {
        dateEl.textContent = this.formatDate();
      }
    },
    
    // 进入世界（钻入式）
    enterWorld: function(world) {
      currentWorld = world;
      var config = worldConfig[world];
      var self = this;
      
      if (!config) {
        console.error('[NavController] 未知世界:', world);
        return;
      }
      
      var container = document.getElementById('app');
      
      // 构建二级标签HTML（都没有active状态，因为默认显示概览）
      var subNavHtml = '';
      config.subViews.forEach(function(sub) {
        subNavHtml += '<div class="sub-nav-item" data-view="' + sub.view + '">' +
          '<span>' + sub.icon + '</span>' +
          '<span>' + sub.label + '</span>' +
        '</div>';
      });
      
      // 构建世界页面（时间栏在顶部，导航在底部）
      var timeStr = this.formatTime();
      var timeParts = timeStr.split(':');
      
      container.innerHTML = 
        '<div class="world-page" data-world="' + world + '">' +
          // 顶部时间栏 - 游戏风格 HUD
          '<div class="time-header">' +
            '<div class="time-left">' +
              '<span class="time-date" id="time-date">' + this.formatDate() + '</span>' +
            '</div>' +
            '<div class="time-center">' +
              '<div class="time-main" id="time-main">' +
                '<span class="time-h">' + timeParts[0] + '</span>' +
                '<span class="time-colon">:</span>' +
                '<span class="time-m">' + timeParts[1] + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="time-right">' +
            '</div>' +
          '</div>' +
          // 标题栏 - 返回按钮 + 动态标题 + 世界选择按钮 同一行
          '<div class="world-header">' +
            '<button class="back-btn" id="back-btn" title="返回概览">← 返回</button>' +
            '<div class="world-title" id="world-title">' + config.icon + ' 概览</div>' +
            '<button class="worlds-btn" id="worlds-btn" title="返回世界选择">🌍</button>' +
          '</div>' +
          // 内容区
          '<div class="world-content" id="world-content"></div>' +
          // 底部导航
          '<div class="sub-nav">' + subNavHtml + '</div>' +
        '</div>';
      
      // 启动时钟更新
      this.startClock();
      
      // 绑定返回按钮（返回概览或从导航栈弹出）
      var self = this;
      var backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          // 如果有导航栈，从栈中弹出并返回
          if (navStack.length > 0) {
            self.popFromNavStack();
            return;
          }
          // 返回概览视图
          window.currentSubView = config.defaultView;
          self.switchSubView(config.defaultView);
          // 清除所有二级标签的激活状态
          container.querySelectorAll('.sub-nav-item').forEach(function(i) {
            i.classList.remove('active');
          });
          // 隐藏返回按钮
          backBtn.style.display = 'none';
        });
      }
      
      // 绑定世界选择器按钮
      var worldsBtn = document.getElementById('worlds-btn');
      if (worldsBtn) {
        worldsBtn.addEventListener('click', function() {
          LifeGame.emit('nav:backToWorlds');
        });
      }
      

      // 绑定二级标签点击
      container.querySelectorAll('.sub-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var view = this.dataset.view;
          
          // 更新激活状态
          container.querySelectorAll('.sub-nav-item').forEach(function(i) {
            i.classList.remove('active');
          });
          this.classList.add('active');
          
          // 切换视图
          window.currentSubView = view;
          self.switchSubView(view);
          // switchSubView 会自动显示返回按钮（非默认视图时）
        });
      });
      
      // 默认显示概览视图（或配置的默认视图）
      currentSubView = config.defaultView;
      this.switchSubView(config.defaultView);
      // switchSubView 会自动处理返回按钮的显示/隐藏
    },
    
    // 启动时钟更新
    clockInterval: null,
    _visibilityHandler: null,
    startClock: function() {
      this.stopClock(); // 先停止之前的
      var self = this;
      this.updateTimeDisplay(); // 立即更新一次
      this.clockInterval = setInterval(function() {
        self.updateTimeDisplay();
      }, 1000); // 每秒更新
      
      // 使用 Page Visibility API 在后台暂停时钟以节省电池
      if (!this._visibilityHandler) {
        this._visibilityHandler = function() {
          if (document.hidden) {
            // 页面不可见时停止时钟
            if (self.clockInterval) {
              clearInterval(self.clockInterval);
              self.clockInterval = null;
            }
          } else {
            // 页面可见时重新启动时钟
            self.updateTimeDisplay();
            self.clockInterval = setInterval(function() {
              self.updateTimeDisplay();
            }, 1000);
          }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);
      }
    },
    
    // 停止时钟更新
    stopClock: function() {
      if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
    },
    
    // 清理时钟相关资源（用于销毁时）
    cleanupClock: function() {
      this.stopClock();
      if (this._visibilityHandler) {
        document.removeEventListener('visibilitychange', this._visibilityHandler);
        this._visibilityHandler = null;
      }
    },
    
    // 更新返回按钮状态
    updateBackButton: function() {
      var backBtn = document.getElementById('back-btn');
      LifeGame.log('[NavController] updateBackButton:', navStack.length, backBtn ? 'found' : 'not found');
      if (backBtn && currentWorld) {
        var config = worldConfig[currentWorld];
        var isDefaultView = (currentSubView === config.defaultView);
        backBtn.style.display = isDefaultView ? 'none' : 'inline-block';
        LifeGame.log('[NavController] button display:', backBtn.style.display, 'isDefaultView:', isDefaultView);
      }
    },
    
    // 推入导航栈
    pushToNavStack: function(state) {
      navStack.push({
        view: currentSubView,
        state: state || {}
      });
      this.updateBackButton();
    },
    
    // 从导航栈弹出并返回
    popFromNavStack: function(callback) {
      if (navStack.length === 0) return false;
      
      var prevState = navStack.pop();
      this.updateBackButton();
      
      // 返回上一级视图
      this.switchSubView(prevState.view, true); // true 表示从栈中恢复，不清空栈
      
      // 如果有回调，在视图切换后执行
      if (callback && typeof callback === 'function') {
        setTimeout(callback, 0);
      }
      
      return true;
    },
    
    // 切换二级视图
    switchSubView: function(view, fromStack, options) {
      LifeGame.log('[NavController] 切换视图:', currentWorld, '→', view, options);
      
      var contentContainer = document.getElementById('world-content');
      if (!contentContainer) {
        console.error('[NavController] 内容容器未找到');
        return;
      }
      
      // 验证视图是否属于当前世界
      if (currentWorld && worldConfig[currentWorld]) {
        var config = worldConfig[currentWorld];
        var validViews = config.subViews.map(function(sv) { return sv.view; });
        // 默认视图也是有效的
        if (config.defaultView) {
          validViews.push(config.defaultView);
        }
        
        if (validViews.indexOf(view) === -1) {
          LifeGame.warn('[NavController] 视图 "' + view + '" 不属于当前世界 "' + currentWorld + '"，切换到默认视图:', config.defaultView);
          view = config.defaultView;
        }
      }
      
      // 清空内容区
      contentContainer.innerHTML = '';
      
      // 如果不是从导航栈恢复，则清空导航栈
      if (!fromStack) {
        navStack = [];
      }
      
      window.currentSubView = view;
      
      // 更新返回按钮状态
      this.updateBackButton();
      
      // 更新标题栏标题
      var titleEl = document.getElementById('world-title');
      if (titleEl && currentWorld) {
        var config = worldConfig[currentWorld];
        var viewLabel = this.getViewLabel(view);
        titleEl.textContent = config.icon + ' ' + viewLabel;
      }
      
      // 获取对应模块并渲染
      var module = LifeGame.getModule(view);
      LifeGame.log('[NavController] 获取模块:', view, module, 'render:', module ? typeof module.render : 'N/A');
      if (module && typeof module.render === 'function') {
        // 显示加载状态
        var loadingId = null;
        var loadingManager = LifeGame.getModule('loading-manager');
        if (loadingManager) {
          loadingId = loadingManager.show('加载中...', { blocking: false });
        }
        
        // 对于 tasks 和 challenges 模块，发送对应事件以正确设置 filter
        // 注意：从导航栈恢复时（fromStack=true），不要重置 filter，保持用户之前的状态
        if (view === 'tasks' && !fromStack) {
          LifeGame.emit('view:tasks', { filter: 'today' });
        } else if (view === 'challenges' && !fromStack) {
          LifeGame.emit('view:challenges', { filter: 'daily' });
        } else if (view === 'action' && options && options.subView) {
          // 对于 action 模块，如果指定了子视图，设置初始状态
          if (options.subView === 'timeline') {
            module.currentView = 'timeline';
          } else {
            module.currentView = 'attr';
          }
        }
        
        // 使用 requestAnimationFrame 确保加载状态显示后再渲染
        var self = this;
        requestAnimationFrame(function() {
          // 传递内容容器给模块（带错误边界）
          try {
            module.render(contentContainer);
          } catch (e) {
            console.error('[NavController] 模块渲染错误:', view, e);
            contentContainer.innerHTML = 
              '<div style="padding:40px;text-align:center;">' +
                '<div style="font-size:48px;margin-bottom:16px;">⚠️</div>' +
                '<h3>模块渲染出错</h3>' +
                '<p style="color:#94a3b8;">' + view + '</p>' +
                '<p style="color:#ef4444;font-size:12px;margin-top:16px;">' + (e.message || 'Unknown error') + '</p>' +
                '<button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:var(--accent);border:none;border-radius:8px;color:#0f172a;font-weight:600;cursor:pointer;">刷新页面</button>' +
              '</div>';
          }
          
          // 隐藏加载状态
          if (loadingManager && loadingId) {
            loadingManager.hide(loadingId);
          }
        });
      } else {
        LifeGame.warn('[NavController] 模块未找到或 render 不是函数:', view, module);
        contentContainer.innerHTML = 
          '<div style="padding:40px;text-align:center;">' +
            '<div style="font-size:48px;margin-bottom:16px;">🚧</div>' +
            '<h3>模块开发中</h3>' +
            '<p style="color:#94a3b8;">' + view + '</p>' +
          '</div>';
        
        // 隐藏加载状态
        if (loadingManager && loadingId) {
          loadingManager.hide(loadingId);
        }
      }
    },
    
    // 显示子页面（推入导航栈）
    showSubPage: function(renderFn) {
      LifeGame.log('[NavController] showSubPage called, navStack before:', navStack.length);
      LifeGame.log('[NavController] .world-page exists:', !!document.querySelector('.world-page'));
      console.trace('[NavController] showSubPage call stack');
      
      navStack.push({
        view: currentSubView,
        state: {}
      });
      LifeGame.log('[NavController] navStack after:', navStack.length);
      this.updateBackButton();
      
      var contentContainer = document.getElementById('world-content');
      if (!contentContainer) {
        console.error('[NavController] world-content not found!');
        return;
      }
      
      contentContainer.innerHTML = '';
      renderFn(contentContainer);
    },
    
    // 获取视图标签
    getViewLabel: function(view) {
      if (view === 'overview') return '概览';
      if (currentWorld && worldConfig[currentWorld]) {
        var subView = worldConfig[currentWorld].subViews.find(function(sv) { return sv.view === view; });
        if (subView) return subView.label;
      }
      return view;
    },
    
    // 显示统计页面（双击 Day 徽章触发）
    showStatsPage: function() {
      var self = this;
      var contentContainer = document.getElementById('world-content');
      if (!contentContainer) return;
      
      // 收集统计数据
      var stats = this.collectStats();
      
      var html = 
        '<div class="stats-page">' +
          '<div class="stats-header">' +
            '<h2>📊 数据统计</h2>' +
            '<button class="stats-close-btn" id="stats-close">✕</button>' +
          '</div>' +
          '<div class="stats-content">' +
            // 属性获取统计
            '<div class="stats-section">' +
              '<h3>💪 属性获取统计</h3>' +
              '<div class="stats-grid">' +
                this.renderAttrStats(stats.attr) +
              '</div>' +
            '</div>' +
            // 每日挑战连续天数
            '<div class="stats-section">' +
              '<h3>🔥 每日挑战连续天数</h3>' +
              '<div class="stats-list">' +
                this.renderChallengeStreaks(stats.challenges) +
              '</div>' +
            '</div>' +
            // 禁止事项连续天数
            '<div class="stats-section">' +
              '<h3>🚫 禁止事项连续天数</h3>' +
              '<div class="stats-list">' +
                this.renderForbidStreaks(stats.forbids) +
              '</div>' +
            '</div>' +
            // 任务完成统计
            '<div class="stats-section">' +
              '<h3>📋 任务完成统计</h3>' +
              '<div class="stats-task-summary">' +
                this.renderTaskStats(stats.tasks) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      contentContainer.innerHTML = html;
      
      // 绑定关闭按钮
      var closeBtn = document.getElementById('stats-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          // 使用 popFromNavStack 返回上一级
          if (!self.popFromNavStack()) {
            // 如果导航栈为空，返回默认视图
            self.switchSubView(worldConfig[currentWorld].defaultView);
          }
        });
      }
      
      // 更新标题
      var worldTitle = document.getElementById('world-title');
      if (worldTitle) {
        worldTitle.textContent = '📊 数据统计';
      }
      
      // 显示返回按钮
      var backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.style.display = 'flex';
      }
    },
    
    // 收集统计数据
    collectStats: function() {
      var storage = LifeGame.core.Storage;
      var result = {
        attr: {},
        challenges: [],
        forbids: [],
        tasks: {}
      };
      
      // 1. 收集属性获取统计（从历史记录）
      var history = storage.get('history') || [];
      var attrStats = {};
      history.forEach(function(record) {
        if (record.attrs) {
          for (var key in record.attrs) {
            if (!attrStats[key]) attrStats[key] = 0;
            attrStats[key] += (record.attrs[key] || 0);
          }
        }
      });
      result.attr = attrStats;
      
      // 2. 收集每日挑战连续天数
      var challengesProgress = storage.get('dailyChallengesProgress') || {};
      var DAILY_CHALLENGES_CONFIG = window.DAILY_CHALLENGES_CONFIG || [];
      result.challenges = DAILY_CHALLENGES_CONFIG.map(function(challenge) {
        var progress = challengesProgress[challenge.id] || {};
        return {
          name: challenge.name,
          icon: challenge.icon,
          streak: progress.totalDays || 0
        };
      });
      
      // 3. 收集禁止事项连续天数
      var forbidsProgress = storage.get('forbiddenProgress') || {};
      var FORBIDDEN_ITEMS_CONFIG = window.FORBIDDEN_ITEMS_CONFIG || [];
      result.forbids = FORBIDDEN_ITEMS_CONFIG.map(function(forbid) {
        var progress = forbidsProgress[forbid.id] || {};
        return {
          name: forbid.name,
          icon: forbid.icon,
          streak: progress.totalDays || 0
        };
      });
      
      // 4. 收集任务完成统计（按难度等级）
      var tasks = storage.get('tasks') || [];
      var taskStats = {};
      tasks.forEach(function(task) {
        var diff = task.diff || 'F';
        if (!taskStats[diff]) {
          taskStats[diff] = { total: 0, completed: 0 };
        }
        taskStats[diff].total++;
        if (task.done) {
          taskStats[diff].completed++;
        }
        
        // 统计子任务
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(function(sub) {
            var subDiff = sub.diff || diff;
            if (!taskStats[subDiff]) {
              taskStats[subDiff] = { total: 0, completed: 0 };
            }
            taskStats[subDiff].total++;
            if (sub.done) {
              taskStats[subDiff].completed++;
            }
          });
        }
      });
      result.tasks = taskStats;
      
      return result;
    },
    
    // 渲染属性统计
    renderAttrStats: function(attrStats) {
      var attrNames = {
        str: '力量',
        dex: '敏捷',
        con: '体质',
        int: '智力',
        wis: '感知',
        cha: '魅力'
      };
      var html = '';
      var hasData = false;
      
      for (var key in attrNames) {
        var value = attrStats[key] || 0;
        if (value !== 0) hasData = true;
        html += 
          '<div class="stats-attr-item">' +
            '<span class="stats-attr-name">' + attrNames[key] + '</span>' +
            '<span class="stats-attr-value">+' + value.toFixed(2) + '</span>' +
          '</div>';
      }
      
      if (!hasData) {
        html = '<div class="stats-empty">暂无属性获取记录</div>';
      }
      
      return html;
    },
    
    // 渲染挑战连续天数
    renderChallengeStreaks: function(challenges) {
      if (!challenges || challenges.length === 0) {
        return '<div class="stats-empty">暂无挑战数据</div>';
      }
      
      var html = '';
      challenges.forEach(function(ch) {
        html += 
          '<div class="stats-streak-item">' +
            '<span class="stats-streak-icon">' + (ch.icon || '🔥') + '</span>' +
            '<span class="stats-streak-name">' + ch.name + '</span>' +
            '<span class="stats-streak-days">' + ch.streak + '天</span>' +
          '</div>';
      });
      return html;
    },
    
    // 渲染禁止事项连续天数
    renderForbidStreaks: function(forbids) {
      if (!forbids || forbids.length === 0) {
        return '<div class="stats-empty">暂无禁止事项数据</div>';
      }
      
      var html = '';
      forbids.forEach(function(fb) {
        html += 
          '<div class="stats-streak-item">' +
            '<span class="stats-streak-icon">' + (fb.icon || '🚫') + '</span>' +
            '<span class="stats-streak-name">' + fb.name + '</span>' +
            '<span class="stats-streak-days">' + fb.streak + '天</span>' +
          '</div>';
      });
      return html;
    },
    
    // 渲染任务统计
    renderTaskStats: function(taskStats) {
      var diffOrder = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
      var html = '';
      var hasData = false;
      
      diffOrder.forEach(function(diff) {
        var stats = taskStats[diff];
        if (stats && stats.total > 0) {
          hasData = true;
          html += 
            '<div class="stats-task-item">' +
              '<span class="stats-task-diff stats-diff-' + diff.toLowerCase() + '">' + diff + '</span>' +
              '<span class="stats-task-count">' + stats.completed + '/' + stats.total + ' 完成</span>' +
              '<div class="stats-task-bar">' +
                '<div class="stats-task-fill" style="width:' + (stats.total > 0 ? stats.completed/stats.total*100 : 0) + '%"></div>' +
              '</div>' +
            '</div>';
        }
      });
      
      if (!hasData) {
        html = '<div class="stats-empty">暂无任务完成记录</div>';
      }
      
      return html;
    }
  };
  
  // 初始化
  if (LifeGame) {
    LifeGame.on('app:ready', function() {
      NavController.init();
      
      // 检查是否有上次选择的世界
      var lastWorld = LifeGame.core.Storage.get('currentWorld');
      var shouldAutoRestore = LifeGame.core.Storage.get('nav.autoRestore');
      
      // 如果之前出现过错误，禁用自动恢复
      if (shouldAutoRestore === false) {
        LifeGame.log('[NavController] 自动恢复已禁用，显示世界选择器');
        NavController.showWorldSelector();
        return;
      }
      
      if (lastWorld && worldConfig[lastWorld]) {
        try {
          LifeGame.log('[NavController] 自动恢复上次世界:', lastWorld);
          NavController.enterWorld(lastWorld);
        } catch (e) {
          console.error('[NavController] 自动恢复失败:', e);
          // 禁用自动恢复，显示世界选择器
          LifeGame.core.Storage.set('nav.autoRestore', false);
          NavController.showWorldSelector();
        }
      } else {
        NavController.showWorldSelector();
      }
    });
  }
  
  // 添加手动重置方法（便于调试和紧急恢复）
  NavController.resetAutoRestore = function() {
    LifeGame.core.Storage.set('nav.autoRestore', true);
    LifeGame.core.Storage.set('currentWorld', null);
    LifeGame.log('[NavController] 已重置自动恢复设置，刷新页面后将显示世界选择器');
    alert('已重置，刷新页面后将显示世界选择器');
  };
  
  NavController.clearLastWorld = function() {
    LifeGame.core.Storage.set('currentWorld', null);
    LifeGame.log('[NavController] 已清除上次世界记录');
  };
  
  // 暴露到全局
  window.NavController = NavController;
  
  // 添加快捷键支持：按 ESC 返回上一级
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentWorld) {
      LifeGame.log('[NavController] ESC 键触发返回上一级');
      LifeGame.emit('nav:back');
    }
  });
  
  // 监听返回上一级事件
  LifeGame.on('nav:back', function() {
    if (!NavController.popFromNavStack()) {
      // 如果导航栈为空，说明当前在二级标签页，返回到默认视图（概览）
      LifeGame.log('[NavController] 导航栈为空，返回到默认视图');
      if (currentWorld && worldConfig[currentWorld]) {
        var config = worldConfig[currentWorld];
        window.currentSubView = config.defaultView;
        NavController.switchSubView(config.defaultView);
        // 清除二级标签激活状态
        document.querySelectorAll('.sub-nav-item').forEach(function(i) {
          i.classList.remove('active');
        });
        // 隐藏返回按钮
        var backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.style.display = 'none';
      }
    }
  });
  
  // 帮助诊断函数：在控制台执行 NavController.diagnose() 查看状态
  NavController.diagnose = function() {
    LifeGame.log('=== NavController 诊断 ===');
    LifeGame.log('currentWorld:', currentWorld);
    LifeGame.log('currentSubView:', currentSubView);
    LifeGame.log('storage currentWorld:', LifeGame.core.Storage.get('currentWorld'));
    LifeGame.log('storage autoRestore:', LifeGame.core.Storage.get('nav.autoRestore'));
    LifeGame.log('========================');
  };
})();
