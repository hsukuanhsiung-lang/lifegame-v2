/**
 * Settings Module - 设置页面
 * 包含主题切换、数据管理等功能
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'settings';
  
  var SettingsModule = {
    currentView: 'settings', // 'settings' | 'guide'
    
    // 事件处理器存储
    _eventHandlers: {},
    
    init: function() {
      LifeGame.log('[settings] 初始化');
      this.cleanup();
      this.bindEvents();
    },
    
    // 清理资源
    cleanup: function() {
      this._eventHandlers = {};
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:settings', function(data) {
        var module = LifeGame.getModule('settings');
        if (module) module.render();
      });
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('world-content');
      }
      if (!container) {
        console.error('[settings] render 失败: 找不到容器');
        return;
      }
      
      var html = this.currentView === 'guide' ? this.buildGuideHTML() : this.buildHTML();
      container.innerHTML = html;
      this.attachEvents(container);
    },
    
    buildHTML: function() {
      // 获取主题管理器信息
      var themeInfo = LifeGame.ThemeManager ? LifeGame.ThemeManager.getInfo() : { mode: 'auto', theme: 'noon' };
      var isAuto = themeInfo.mode === 'auto';
      var isLight = themeInfo.mode === 'light';
      var isDark = themeInfo.mode === 'dark';
      
      // 当前主题状态文本
      var themeStatus = '';
      if (isAuto) {
        var hour = new Date().getHours();
        var currentTheme = LifeGame.ThemeManager ? LifeGame.ThemeManager.getCurrentTheme() : 'noon';
        var themeNames = {
          morning: '🌅 早晨',
          noon: '☀️ 正午',
          afternoon: '🌤️ 下午',
          evening: '🌆 黄昏',
          night: '🌙 夜晚',
          midnight: '🌑 午夜'
        };
        themeStatus = themeNames[currentTheme] || '☀️ 白天';
      } else {
        themeStatus = isLight ? '☀️ 固定白天' : '🌙 固定黑夜';
      }
      
      return [
        '<div class="settings-container">',
          // 子标签导航
          '<div class="settings-tabs">',
            '<button class="settings-tab ' + (this.currentView === 'settings' ? 'active' : '') + '" data-view="settings">⚙️ 设置</button>',
            '<button class="settings-tab ' + (this.currentView === 'guide' ? 'active' : '') + '" data-view="guide">📖 说明</button>',
          '</div>',
          
          // 主题设置卡片
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🎨</span>',
              '<span class="settings-card-title">主题外观</span>',
            '</div>',
            '<div class="settings-card-body">',
              // 当前状态
              '<div class="theme-current-status">',
                '<span class="theme-status-label">当前主题</span>',
                '<span class="theme-status-value">' + themeStatus + '</span>',
              '</div>',
              // 主题切换按钮
              '<div class="theme-options">',
                '<button class="theme-option-btn ' + (isAuto ? 'active' : '') + '" data-mode="auto">',
                  '<span class="theme-option-icon">🔄</span>',
                  '<span class="theme-option-name">自动</span>',
                  '<span class="theme-option-desc">随时间自动切换</span>',
                '</button>',
                '<button class="theme-option-btn ' + (isLight ? 'active' : '') + '" data-mode="light">',
                  '<span class="theme-option-icon">☀️</span>',
                  '<span class="theme-option-name">白天</span>',
                  '<span class="theme-option-desc">固定浅色主题</span>',
                '</button>',
                '<button class="theme-option-btn ' + (isDark ? 'active' : '') + '" data-mode="dark">',
                  '<span class="theme-option-icon">🌙</span>',
                  '<span class="theme-option-name">黑夜</span>',
                  '<span class="theme-option-desc">固定深色主题</span>',
                '</button>',
              '</div>',
            '</div>',
          '</div>',
          
          // 时间栏颜色设置卡片
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🕐</span>',
              '<span class="settings-card-title">时间栏颜色</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="timebar-color-desc">选择顶部时间栏的颜色风格</div>',
              '<div class="timebar-color-options">',
                this.buildTimebarColorOptions(),
              '</div>',
            '</div>',
          '</div>',
          
          // 数据管理卡片
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">💾</span>',
              '<span class="settings-card-title">数据管理</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="settings-actions">',
                '<button class="settings-action-btn" id="export-data-btn">',
                  '<span class="action-icon">📤</span>',
                  '<span class="action-text">导出数据</span>',
                '</button>',
                '<button class="settings-action-btn" id="import-data-btn">',
                  '<span class="action-icon">📥</span>',
                  '<span class="action-text">导入数据</span>',
                '</button>',
                '<button class="settings-action-btn danger" id="clear-data-btn">',
                  '<span class="action-icon">🗑️</span>',
                  '<span class="action-text">清除所有数据</span>',
                '</button>',
              '</div>',
            '</div>',
          '</div>',
          
          // GitHub 同步卡片
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🔄</span>',
              '<span class="settings-card-title">GitHub 云端同步</span>',
            '</div>',
            '<div class="settings-card-body">',
              this.buildGitHubSyncHTML(),
            '</div>',
          '</div>',
          
          // 关于卡片
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">ℹ️</span>',
              '<span class="settings-card-title">关于</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="about-info">',
                '<div class="about-version">Life Game v2.0</div>',
                '<div class="about-desc">你的游戏化人生管理系统</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    },
    
    // 构建 GitHub 同步 HTML
    buildGitHubSyncHTML: function() {
      var sync = LifeGame.getModule('github-sync');
      if (!sync) {
        return '<div class="github-sync-notice">模块未加载</div>';
      }
      
      var status = sync.getStatus();
      var isConfigured = status.configured;
      var isEnabled = status.enabled;
      
      // 状态文本
      var statusText = '未配置';
      var statusClass = 'status-not-configured';
      if (isConfigured) {
        if (status.syncing) {
          statusText = '同步中...';
          statusClass = 'status-syncing';
        } else if (status.lastError) {
          statusText = '同步失败';
          statusClass = 'status-error';
        } else if (status.lastSyncTime) {
          statusText = '已同步';
          statusClass = 'status-synced';
        } else {
          statusText = '待同步';
          statusClass = 'status-pending';
        }
      }
      
      // 上次同步时间
      var lastSyncText = '无';
      if (status.lastSyncTime) {
        var date = new Date(status.lastSyncTime);
        lastSyncText = date.toLocaleString('zh-CN', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
      }
      
      return [
        '<div class="github-sync-container">',
          // Token 输入
          '<div class="github-sync-section">',
            '<label class="github-sync-label">GitHub Token</label>',
            '<div class="github-sync-input-wrap">',
              '<input type="password" id="github-token-input" class="github-sync-input" placeholder="ghp_xxxxxxxxxxxx" value="' + (isConfigured ? '********' : '') + '">',
              '<button id="github-token-save" class="github-sync-btn-small">保存</button>',
            '</div>',
            '<div class="github-sync-hint">在 GitHub Settings → Developer settings → Personal access tokens 生成</div>',
          '</div>',
          
          // 状态显示
          '<div class="github-sync-status">',
            '<div class="github-sync-status-item">',
              '<span class="github-sync-status-label">状态</span>',
              '<span class="github-sync-status-value ' + statusClass + '">' + statusText + '</span>',
            '</div>',
            '<div class="github-sync-status-item">',
              '<span class="github-sync-status-label">上次同步</span>',
              '<span class="github-sync-status-value">' + lastSyncText + '</span>',
            '</div>',
          '</div>',
          
          // 自动同步开关
          '<div class="github-sync-toggle">',
            '<label class="github-sync-toggle-label">',
              '<input type="checkbox" id="github-sync-enabled" ' + (isEnabled ? 'checked' : '') + ' ' + (isConfigured ? '' : 'disabled') + '>',
              '<span class="github-sync-toggle-text">自动同步（30秒防抖）</span>',
            '</label>',
          '</div>',
          
          // 操作按钮
          '<div class="github-sync-actions">',
            '<button id="github-sync-now" class="github-sync-btn" ' + (isConfigured ? '' : 'disabled') + '>立即同步</button>',
            '<button id="github-clear-token" class="github-sync-btn danger" ' + (isConfigured ? '' : 'disabled') + '>清除 Token</button>',
          '</div>',
          
          // 错误提示
          status.lastError ? '<div class="github-sync-error">错误: ' + status.lastError + '</div>' : '',
        '</div>'
      ].join('');
    },
    
    // 构建时间栏颜色选项
    buildTimebarColorOptions: function() {
      // 获当前选择的颜色方案
      var currentColor = LifeGame.core.Storage.get('timebarColor') || 'gold';
      
      var colors = [
        { id: 'gold', name: '金黄', icon: '🏆', desc: '游戏金币风', color: '#ffeb3b', bg: 'linear-gradient(135deg, #ffd700, #ffeb3b)' },
        { id: 'cyan', name: '青蓝', icon: '❄️', desc: '科技冷静', color: '#22d3ee', bg: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
        { id: 'orange', name: '橙红', icon: '🔥', desc: '活力激情', color: '#fb923c', bg: 'linear-gradient(135deg, #f97316, #fb923c)' },
        { id: 'silver', name: '白银', icon: '🤍', desc: '简洁优雅', color: '#f8fafc', bg: 'linear-gradient(135deg, #cbd5e1, #f8fafc)' },
        { id: 'purple', name: '粉紫', icon: '💜', desc: '赛博鹏克', color: '#e879f9', bg: 'linear-gradient(135deg, #a855f7, #e879f9)' },
        { id: 'green', name: '绿色', icon: '🌿', desc: '复古护眼', color: '#4ade80', bg: 'linear-gradient(135deg, #22c55e, #4ade80)' }
      ];
      
      return colors.map(function(item) {
        var isActive = currentColor === item.id;
        return '<button class="timebar-color-btn ' + (isActive ? 'active' : '') + '" data-color="' + item.id + '">' +
          '<span class="timebar-color-preview" style="background: ' + item.bg + '"></span>' +
          '<span class="timebar-color-info">' +
            '<span class="timebar-color-name">' + item.icon + ' ' + item.name + '</span>' +
            '<span class="timebar-color-desc">' + item.desc + '</span>' +
          '</span>' +
          (isActive ? '<span class="timebar-color-check">✓</span>' : '') +
        '</button>';
      }).join('');
    },
    
    // 构建说明页面 HTML
    buildGuideHTML: function() {
      // 任务等级配置 - 9级颜色系统
      var levels = [
        { level: 'F', name: '初心', color: '#6b7280', exp: 1, desc: '最基础的任务' },
        { level: 'E', name: '学徒', color: '#8b7355', exp: 5, desc: '铜色标记的日常任务' },
        { level: 'D', name: '熟练', color: '#3b82f6', exp: 10, desc: '蓝色标记，需要一定专注' },
        { level: 'C', name: '进阶', color: '#22c55e', exp: 100, desc: '绿色标记，持续努力目标' },
        { level: 'B', name: '专家', color: '#a855f7', exp: 1000, desc: '紫色标记，复杂项目任务' },
        { level: 'A', name: '大师', color: '#f59e0b', exp: 10000, desc: '金色标记，宏大目标里程碑' },
        { level: 'S', name: '史诗', color: '#ef4444', exp: 100000, desc: '红色标记+脉冲特效，史诗级成就' },
        { level: 'SS', name: '传说', color: 'gradient', exp: 1000000, desc: '红紫双色渐变+旋转边框，传说级任务' },
        { level: 'SSS', name: '神话', color: 'animated', exp: 10000000, desc: '红蓝金三色渐变+终极特效，神话级任务' }
      ];
      
      var levelsHtml = levels.map(function(item) {
        var colorStyle = '';
        var colorClass = '';
        if (item.color === 'gradient') {
          colorStyle = 'background: linear-gradient(135deg, #ef4444, #a855f7);';
        } else if (item.color === 'animated') {
          colorStyle = 'background: linear-gradient(135deg, #ef4444, #3b82f6, #facc15); animation: sssBadgeGlow 2s ease-in-out infinite;';
        } else {
          colorStyle = 'background: ' + item.color + '; color: #fff;';
        }
        
        return '<div class="level-item">' +
          '<div class="level-badge" style="' + colorStyle + '">' + item.level + '</div>' +
          '<div class="level-info">' +
            '<div class="level-name">' + item.name + '</div>' +
            '<div class="level-exp">' + item.exp.toLocaleString() + ' EXP</div>' +
            '<div class="level-desc">' + item.desc + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      
      return [
        '<div class="settings-container">',
          // 子标签导航
          '<div class="settings-tabs">',
            '<button class="settings-tab" data-view="settings">⚙️ 设置</button>',
            '<button class="settings-tab active" data-view="guide">📖 说明</button>',
          '</div>',
          
          // 新手指引
          '<div class="settings-card guide-intro">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🎮</span>',
              '<span class="settings-card-title">欢迎来到 Life Game</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<p class="guide-text">Life Game 是一个游戏化的人生管理系统。你将扮演自己人生的主角，通过完成任务、坚持挑战、避免禁忌事项来获得经验值，提升等级，最终成为更好的自己。</p>',
            '</div>',
          '</div>',
          
          // 任务系统说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">📋</span>',
              '<span class="settings-card-title">任务系统</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="guide-section">',
                '<h4>📝 今日任务</h4>',
                '<p>当天需要完成的短期任务。默认显示今天的任务，双击"今日"标签可切换到明天/后天。任务完成后会获得经验值。</p>',
              '</div>',
              '<div class="guide-section">',
                '<h4>🎯 长期任务</h4>',
                '<p>需要持续努力的大目标。通过完成子任务积累经验，经验达到100%即可完成任务。支持多级子任务嵌套。</p>',
              '</div>',
              '<div class="guide-section">',
                '<h4>📥 收集箱</h4>',
                '<p>临时存放灵感和待整理的任务。可以一键转为今日任务，或关联到长期任务作为子任务。</p>',
              '</div>',
            '</div>',
          '</div>',
          
          // 思维导图说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🧠</span>',
              '<span class="settings-card-title">思维导图（子任务管理）</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="guide-section">',
                '<h4>如何打开</h4>',
                '<p>进入长期任务详情页 → 双击"子任务"标签 → 进入思维导图视图</p>',
              '</div>',
              '<div class="guide-section">',
                '<h4>操作说明</h4>',
                '<ul class="guide-list">',
                  '<li><strong>单击节点</strong>：完成任务（会弹出确认框）</li>',
                  '<li><strong>双击节点</strong>：编辑子任务（可修改名称、难度、优先级、日期）</li>',
                  '<li><strong>颜色含义</strong>：',
                    '<ul>',
                      '<li>🟢 <strong>绿色</strong>：已完成</li>',
                      '<li>🔴 <strong>红色</strong>：已过期（截止日期在今天之前）</li>',
                      '<li>🔵 <strong>蓝色</strong>：正常进行中</li>',
                      '<li>➖ <strong>虚线边框</strong>：高优先级任务</li>',
                    '</ul>',
                  '</li>',
                  '<li><strong>添加子任务</strong>：双击节点进入编辑 → 点击"添加下级子任务"按钮</li>',
                  '<li><strong>删除子任务</strong>：双击节点进入编辑 → 点击"删除"按钮</li>',
                '</ul>',
              '</div>',
            '</div>',
          '</div>',
          
          // 挑战系统说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">🔥</span>',
              '<span class="settings-card-title">挑战系统</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="guide-section">',
                '<h4>✅ 每日挑战</h4>',
                '<p>每天坚持的好习惯（如冥想、健身、读书等）。完成打卡可获得经验值，连续全勤还有额外奖励。</p>',
              '</div>',
              '<div class="guide-section">',
                '<h4>🚫 禁止事项</h4>',
                '<p>需要戒除的坏习惯（如戒烟、戒游戏等）。每天默认坚守成功，如果违规需要点击标记。坚守可获得钻石，违规会受到惩罚（F-A级掉回F级，S-SSS级保持等级但天数清零）。</p>',
              '</div>',
            '</div>',
          '</div>',
          
          // 任务等级说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">📊</span>',
              '<span class="settings-card-title">任务等级（9级系统）</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<p class="guide-text">任务等级决定完成时获得的经验值。等级越高，经验值越多，任务也越困难。</p>',
              '<div class="levels-list">',
                levelsHtml,
              '</div>',
            '</div>',
          '</div>',
          
          // 契合度系统说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">💫</span>',
              '<span class="settings-card-title">契合度系统</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<p class="guide-text">契合度反映你与 Life Game 系统的同步程度。完成任务、坚持挑战可提升契合度；长期不活跃、违反禁止事项会降低契合度。</p>',
              '<div class="guide-section">',
                '<h4>契合度等级</h4>',
                '<ul class="guide-list">',
                  '<li>0-20%：疏离</li>',
                  '<li>21-40%：相识</li>',
                  '<li>41-60%：熟悉</li>',
                  '<li>61-80%：默契</li>',
                  '<li>81-99%：共鸣</li>',
                  '<li>100%：合一</li>',
                '</ul>',
              '</div>',
              '<p class="guide-text">高契合度可获得经验加成和特殊奖励。</p>',
            '</div>',
          '</div>',
          
          // 灵魂形态说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">👻</span>',
              '<span class="settings-card-title">灵魂形态进化</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<p class="guide-text">在"角色"页面可查看和进化灵魂形态。消耗钻石可以解锁新的灵魂形态，每种形态都有独特的外观和效果。</p>',
              '<div class="guide-section">',
                '<h4>钻石获取方式</h4>',
                '<ul class="guide-list">',
                  '<li>坚守禁止事项（每天根据等级获得）</li>',
                  '<li>完成每日挑战全勤（10项全部完成+1骰子，随机1-6钻石）</li>',
                '</ul>',
              '</div>',
            '</div>',
          '</div>',
          
          // 历史记录说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">📜</span>',
              '<span class="settings-card-title">历史记录</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<p class="guide-text">记录你所有的操作和成就。可以查看今天的完成情况，也可以回顾过去的记录。</p>',
              '<p class="guide-text">完成的任务可以取消（会扣除相应的经验值），在历史记录中点击"取消完成"即可。</p>',
            '</div>',
          '</div>',
          
          // 经验值说明
          '<div class="settings-card">',
            '<div class="settings-card-header">',
              '<span class="settings-card-icon">✨</span>',
              '<span class="settings-card-title">经验值获取方式</span>',
            '</div>',
            '<div class="settings-card-body">',
              '<div class="exp-rules">',
                '<div class="exp-rule-item">',
                  '<span class="exp-rule-icon">📝</span>',
                  '<span class="exp-rule-text"><strong>完成子任务</strong>：根据任务等级获得对应经验值（F=1, E=5, D=10, C=100, B=1000...）</span>',
                '</div>',
                '<div class="exp-rule-item">',
                  '<span class="exp-rule-icon">🎯</span>',
                  '<span class="exp-rule-text"><strong>长期任务完成</strong>：经验满100%可标记为完成</span>',
                '</div>',
                '<div class="exp-rule-item">',
                  '<span class="exp-rule-icon">🔥</span>',
                  '<span class="exp-rule-text"><strong>每日挑战</strong>：每项+1经验，全勤额外+100经验</span>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
          
        '</div>'
      ].join('');
    },
    
    attachEvents: function(container) {
      var self = this;
      
      // 防止重复绑定
      if (container.dataset.settingsEventsBound === 'true') return;
      container.dataset.settingsEventsBound = 'true';
      
      this._eventHandlers = {};
      
      // 使用事件委托
      this._eventHandlers.click = function(e) {
        // 子标签切换
        var tab = e.target.closest('.settings-tab');
        if (tab) {
          var view = tab.dataset.view;
          if (view !== self.currentView) {
            self.currentView = view;
            self.render(container);
          }
          return;
        }
        
        // 主题切换按钮
        var themeBtn = e.target.closest('.theme-option-btn');
        if (themeBtn) {
          var mode = themeBtn.dataset.mode;
          if (LifeGame.ThemeManager) {
            LifeGame.ThemeManager.setMode(mode);
            self.render(container);
          }
          return;
        }
        
        // 时间栏颜色选择
        var colorBtn = e.target.closest('.timebar-color-btn');
        if (colorBtn) {
          var color = colorBtn.dataset.color;
          LifeGame.core.Storage.set('timebarColor', color);
          self.applyTimebarColor(color);
          self.render(container);
          if (LifeGame.showSuccess) {
            LifeGame.showSuccess('已切换到' + colorBtn.querySelector('.timebar-color-name').textContent);
          }
          return;
        }
        
        // 导出数据
        if (e.target.closest('#export-data-btn')) {
          self.exportData();
          return;
        }
        
        // 导入数据
        if (e.target.closest('#import-data-btn')) {
          self.importData();
          return;
        }
        
        // 清除数据
        if (e.target.closest('#clear-data-btn')) {
          self.clearAllData();
          return;
        }
        
        // 保存 GitHub Token
        if (e.target.closest('#github-token-save')) {
          self.saveGitHubToken();
          return;
        }
        
        // 手动同步到 GitHub
        if (e.target.closest('#github-sync-now')) {
          self.syncToGitHub();
          return;
        }
        
        // 切换自动同步
        if (e.target.closest('#github-sync-enabled')) {
          self.toggleAutoSync();
          return;
        }
        
        // 清除 GitHub Token
        if (e.target.closest('#github-clear-token')) {
          self.clearGitHubToken();
          return;
        }
      };
      
      container.addEventListener('click', this._eventHandlers.click);
    },
    
    // 导出数据
    exportData: function() {
      var data = LifeGame.core.Storage.getData();
      var dataStr = JSON.stringify(data, null, 2);
      var blob = new Blob([dataStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      
      var a = document.createElement('a');
      a.href = url;
      a.download = 'lifegame_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('数据已导出！');
    },
    
    // 允许导入的数据键名白名单
    _allowedImportKeys: ['tasks', 'profile', 'perfectDays', 'perfectRecord', 'diceChest', 
                         'forbidRecords', 'forbiddenItems', 'dailyChallenges', 'lastChallengeCheck',
                         'lastPerfectCheck', 'timeline', 'actionTimeline', 'customActions',
                         'currentWorld', 'history', 'soulForms', 'settings'],
    
    // 验证导入的数据
    _validateImportData: function(data) {
      if (!data || typeof data !== 'object') {
        return { valid: false, error: '数据格式错误：必须是对象' };
      }
      
      // 检查必需的键
      var hasValidKey = false;
      for (var key in data) {
        if (this._allowedImportKeys.indexOf(key) !== -1) {
          hasValidKey = true;
          break;
        }
      }
      
      if (!hasValidKey) {
        return { valid: false, error: '数据格式错误：未找到有效的数据键' };
      }
      
      // 验证数据大小（最大 5MB）
      var dataSize = JSON.stringify(data).length;
      if (dataSize > 5 * 1024 * 1024) {
        return { valid: false, error: '数据过大：超过 5MB 限制' };
      }
      
      return { valid: true };
    },
    
    // 导入数据
    importData: function() {
      var self = this;
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        // 检查文件大小
        if (file.size > 5 * 1024 * 1024) {
          alert('文件过大：最大支持 5MB');
          return;
        }
        
        var reader = new FileReader();
        reader.onload = function(event) {
          try {
            var data = JSON.parse(event.target.result);
            
            // 验证数据
            var validation = self._validateImportData(data);
            if (!validation.valid) {
              alert('导入失败：' + validation.error);
              return;
            }
            
            if (confirm('确定要导入数据吗？这将覆盖当前所有数据！')) {
              // 只保存白名单中的键
              for (var key in data) {
                if (self._allowedImportKeys.indexOf(key) !== -1) {
                  LifeGame.core.Storage.set(key, data[key]);
                }
              }
              alert('数据导入成功！页面将刷新。');
              location.reload();
            }
          } catch (err) {
            alert('导入失败：文件格式错误');
            console.error('[settings] 导入错误:', err);
          }
        };
        reader.onerror = function() {
          alert('读取文件失败');
        };
        reader.readAsText(file);
      };
      
      input.click();
    },
    
    // 应用时间栏颜色
    applyTimebarColor: function(color) {
      color = color || LifeGame.core.Storage.get('timebarColor') || 'gold';
      
      // 定义各颜色方案的 CSS 变量 - 时间颜色调亮，与日期一样明亮
      var colorSchemes = {
        gold: {
          '--timebar-date': '#ffd700',
          '--timebar-main': '#ffd700',  // 和日期一样的金黄色
          '--timebar-stroke': '#b8860b',
          '--timebar-badge-bg': 'rgba(251, 191, 36, 0.2)',
          '--timebar-badge-bg2': 'rgba(245, 158, 11, 0.3)',
          '--timebar-badge-border': 'rgba(251, 191, 36, 0.5)',
          '--timebar-badge-color': '#fbbf24'
        },
        cyan: {
          '--timebar-date': '#67e8f9',
          '--timebar-main': '#67e8f9',  // 和日期一样的青色
          '--timebar-stroke': '#0891b2',
          '--timebar-badge-bg': 'rgba(6, 182, 212, 0.25)',
          '--timebar-badge-bg2': 'rgba(59, 130, 246, 0.35)',
          '--timebar-badge-border': 'rgba(103, 232, 249, 0.5)',
          '--timebar-badge-color': '#67e8f9'
        },
        orange: {
          '--timebar-date': '#fdba74',
          '--timebar-main': '#fdba74',  // 和日期一样的橙色
          '--timebar-stroke': '#c2410c',
          '--timebar-badge-bg': 'rgba(251, 146, 60, 0.25)',
          '--timebar-badge-bg2': 'rgba(239, 68, 68, 0.35)',
          '--timebar-badge-border': 'rgba(253, 186, 116, 0.5)',
          '--timebar-badge-color': '#fdba74'
        },
        silver: {
          '--timebar-date': '#cbd5e1',
          '--timebar-main': '#cbd5e1',  // 和日期一样的白色
          '--timebar-stroke': '#64748b',
          '--timebar-badge-bg': 'rgba(148, 163, 184, 0.2)',
          '--timebar-badge-bg2': 'rgba(203, 213, 225, 0.25)',
          '--timebar-badge-border': 'rgba(203, 213, 225, 0.4)',
          '--timebar-badge-color': '#e2e8f0'
        },
        purple: {
          '--timebar-date': '#f0abfc',
          '--timebar-main': '#f0abfc',  // 和日期一样的粉紫色
          '--timebar-stroke': '#a21caf',
          '--timebar-badge-bg': 'rgba(168, 85, 247, 0.25)',
          '--timebar-badge-bg2': 'rgba(236, 72, 153, 0.35)',
          '--timebar-badge-border': 'rgba(240, 171, 252, 0.5)',
          '--timebar-badge-color': '#f0abfc'
        },
        green: {
          '--timebar-date': '#86efac',
          '--timebar-main': '#86efac',  // 和日期一样的绿色
          '--timebar-stroke': '#166534',
          '--timebar-badge-bg': 'rgba(34, 197, 94, 0.25)',
          '--timebar-badge-bg2': 'rgba(74, 222, 128, 0.35)',
          '--timebar-badge-border': 'rgba(134, 239, 172, 0.5)',
          '--timebar-badge-color': '#86efac'
        }
      };
      
      var scheme = colorSchemes[color] || colorSchemes.gold;
      var root = document.documentElement;
      
      // 应用 CSS 变量
      for (var key in scheme) {
        root.style.setProperty(key, scheme[key]);
      }
      
      // 保存选择
      LifeGame.core.Storage.set('timebarColor', color);
      
      LifeGame.log('[Settings] 时间栏颜色已切换为:', color);
    },
    
    // 清除所有数据
    clearAllData: function() {
      if (confirm('⚠️ 警告：确定要清除所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：真的要删除所有数据吗？')) {
          LifeGame.core.Storage.reset();
          alert('所有数据已清除！页面将刷新。');
          location.reload();
        }
      }
    },
    
    // 保存 GitHub Token
    saveGitHubToken: function() {
      var input = document.getElementById('github-token-input');
      if (!input) return;
      
      var token = input.value.trim();
      if (!token || token === '********') {
        // 如果没有输入或显示的是掩码，不做任何操作
        return;
      }
      
      // 验证 Token 格式
      if (!token.match(/^ghp_[a-zA-Z0-9]{36}$/)) {
        if (LifeGame.showError) {
          LifeGame.showError('Token 格式不正确，请以 ghp_ 开头');
        } else {
          alert('Token 格式不正确，请以 ghp_ 开头');
        }
        return;
      }
      
      // 保存 Token
      localStorage.setItem('lg_github_token', token);
      
      // 更新 GitHub 同步模块状态
      var sync = LifeGame.getModule('github-sync');
      if (sync) {
        sync._saveStatus();
      }
      
      // 重新渲染以更新状态显示
      var container = document.getElementById('settings-container');
      if (container) {
        this.render(container);
      }
      
      if (LifeGame.showSuccess) {
        LifeGame.showSuccess('GitHub Token 已保存');
      }
    },
    
    // 清除 GitHub Token
    clearGitHubToken: function() {
      if (!confirm('确定要清除 GitHub Token 吗？这将停止云端同步。')) {
        return;
      }
      
      localStorage.removeItem('lg_github_token');
      
      // 重新渲染以更新状态显示
      var container = document.getElementById('settings-container');
      if (container) {
        this.render(container);
      }
      
      if (LifeGame.showInfo) {
        LifeGame.showInfo('GitHub Token 已清除');
      }
    },
    
    // 手动同步到 GitHub
    syncToGitHub: function() {
      var sync = LifeGame.getModule('github-sync');
      if (!sync) {
        if (LifeGame.showError) {
          LifeGame.showError('GitHub 同步功能未加载');
        }
        return;
      }
      
      var self = this;
      var btn = document.getElementById('github-sync-now');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '同步中...';
      }
      
      // 立即同步
      sync.sync().then(function(result) {
        // 重新渲染以更新状态
        var container = document.getElementById('settings-container');
        if (container) {
          self.render(container);
        }
        
        if (result && result.success) {
          if (LifeGame.showSuccess) {
            LifeGame.showSuccess('同步成功！');
          }
        } else if (result && result.skipped) {
          // 被跳过的同步不显示错误
          if (LifeGame.showInfo) {
            var reason = result.reason === 'not_configured' ? '未配置 Token' :
                         result.reason === 'disabled' ? '自动同步已禁用' :
                         result.reason === 'in_progress' ? '同步进行中' : '已跳过';
            LifeGame.showInfo('同步' + reason);
          }
        } else {
          if (LifeGame.showError) {
            LifeGame.showError('同步失败: ' + (result && result.error ? result.error : '未知错误'));
          }
        }
      });
    },
    
    // 切换自动同步
    toggleAutoSync: function() {
      var checkbox = document.getElementById('github-sync-enabled');
      if (!checkbox) return;
      
      var enabled = checkbox.checked;
      
      var sync = LifeGame.getModule('github-sync');
      if (sync && sync.setEnabled) {
        sync.setEnabled(enabled);
      } else {
        localStorage.setItem('githubSyncEnabled', enabled ? 'true' : 'false');
      }
      
      if (LifeGame.showSuccess) {
        LifeGame.showSuccess(enabled ? '自动同步已开启' : '自动同步已关闭');
      }
    }
  };
  
  // 注册模块
  LifeGame.register(MODULE_NAME, SettingsModule);
  
})();
