/**
 * Theme Manager - 时间渐变主题与手动切换系统
 * 
 * 功能：
 * 1. 根据时间自动切换主题（6个时间段）
 * 2. 支持手动切换（自动/白天/黑夜）
 * 3. 持久化保存用户选择
 */

(function() {
  'use strict';
  
  var THEME_KEY = 'lifegame_theme_mode';
  var THEME_UPDATE_INTERVAL = 60000; // 每分钟检查一次
  
  // 主题配置
  var THEME_CONFIG = {
    morning: {
      name: '早晨',
      icon: '🌅',
      hourRange: [5, 10],
      bg: 'linear-gradient(135deg, #FFE5B4 0%, #FFF8DC 100%)',
      cardBg: 'rgba(255, 255, 255, 0.85)',
      text: '#5a4a3a',
      text2: '#7a6a5a',
      accent: '#4a90a4',
      navBg: 'rgba(255, 248, 220, 0.9)'
    },
    noon: {
      name: '正午',
      icon: '☀️',
      hourRange: [10, 14],
      bg: '#f5f7fa',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#2d3748',
      text2: '#4a5568',
      accent: '#3182ce',
      navBg: 'rgba(245, 247, 250, 0.95)'
    },
    afternoon: {
      name: '下午',
      icon: '🌤️',
      hourRange: [14, 17],
      bg: 'linear-gradient(135deg, #FFE4C4 0%, #F5DEB3 100%)',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      text: '#4a3a2a',
      text2: '#6a5a4a',
      accent: '#d69e2e',
      navBg: 'rgba(255, 228, 196, 0.9)'
    },
    evening: {
      name: '黄昏',
      icon: '🌆',
      hourRange: [17, 20],
      bg: 'linear-gradient(135deg, #DDA0DD 0%, #8B7B8B 100%)',
      cardBg: 'rgba(255, 255, 255, 0.15)',
      text: '#ffffff',
      text2: '#e0e0e0',
      accent: '#e94560',
      navBg: 'rgba(139, 123, 139, 0.9)'
    },
    night: {
      name: '夜晚',
      icon: '🌙',
      hourRange: [20, 23],
      bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
      cardBg: 'rgba(26, 26, 26, 0.9)',
      text: '#f5f5f5',
      text2: '#b0b0b0',
      accent: '#fbbf24',
      navBg: 'rgba(13, 13, 13, 0.95)'
    },
    midnight: {
      name: '午夜',
      icon: '🌑',
      hourRange: [23, 5], // 跨午夜
      bg: 'linear-gradient(135deg, #000000 0%, #0d0d0d 100%)',
      cardBg: 'rgba(20, 20, 20, 0.95)',
      text: '#ffffff',
      text2: '#a0a0a0',
      accent: '#fbbf24',
      navBg: 'rgba(0, 0, 0, 0.95)'
    }
  };
  
  var ThemeManager = {
    currentMode: 'auto', // auto, light, dark
    currentTheme: 'midnight',
    updateTimer: null,
    
    init: function() {
      LifeGame.log('[ThemeManager] 初始化');
      this.loadSavedMode();
      this.applyTheme();
      this.startAutoUpdate();
      this.injectThemeStyles();
    },
    
    // 加载保存的模式
    loadSavedMode: function() {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved && ['auto', 'light', 'dark'].indexOf(saved) !== -1) {
        this.currentMode = saved;
      }
      LifeGame.log('[ThemeManager] 加载保存的模式:', this.currentMode);
    },
    
    // 保存模式
    saveMode: function(mode) {
      this.currentMode = mode;
      localStorage.setItem(THEME_KEY, mode);
      LifeGame.log('[ThemeManager] 保存模式:', mode);
    },
    
    // 获取当前小时对应的主题
    getThemeByHour: function(hour) {
      if (hour >= 5 && hour < 10) return 'morning';
      if (hour >= 10 && hour < 14) return 'noon';
      if (hour >= 14 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 20) return 'evening';
      if (hour >= 20 && hour < 23) return 'night';
      return 'midnight';
    },
    
    // 获取当前应应用的主题
    getCurrentTheme: function() {
      var hour = new Date().getHours();
      
      if (this.currentMode === 'light') {
        return 'noon';
      } else if (this.currentMode === 'dark') {
        return 'midnight';
      } else {
        // auto mode
        return this.getThemeByHour(hour);
      }
    },
    
    // 应用主题
    applyTheme: function() {
      var theme = this.getCurrentTheme();
      var config = THEME_CONFIG[theme];
      
      if (!config) {
        console.error('[ThemeManager] 未知主题:', theme);
        return;
      }
      
      this.currentTheme = theme;
      
      // 应用到CSS变量
      var root = document.documentElement;
      root.style.setProperty('--bg', config.bg);
      root.style.setProperty('--card', config.cardBg);
      root.style.setProperty('--text', config.text);
      root.style.setProperty('--text2', config.text2);
      root.style.setProperty('--accent', config.accent);
      
      // 应用导航栏背景
      var navBar = document.getElementById('nav-bar');
      if (navBar) {
        navBar.style.background = config.navBg;
      }
      
      // 设置body背景
      document.body.style.background = config.bg;
      document.body.style.color = config.text;
      
      // 根据主题调整卡片边框颜色
      if (theme === 'night' || theme === 'midnight') {
        root.style.setProperty('--card-border', 'rgba(148, 163, 184, 0.1)');
      } else if (theme === 'evening') {
        root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.1)');
      } else {
        root.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.08)');
      }
      
      LifeGame.log('[ThemeManager] 应用主题:', theme, config.name);
      
      // 触发主题变更事件
      LifeGame.emit('theme:changed', { 
        theme: theme, 
        config: config,
        mode: this.currentMode 
      });
    },
    
    // 设置模式
    setMode: function(mode) {
      if (['auto', 'light', 'dark'].indexOf(mode) === -1) {
        console.error('[ThemeManager] 无效模式:', mode);
        return;
      }
      
      this.saveMode(mode);
      this.applyTheme();
      
      // 如果切换到auto，确保定时器运行
      if (mode === 'auto') {
        this.startAutoUpdate();
      }
    },
    
    // 开始自动更新
    startAutoUpdate: function() {
      var self = this;
      
      // 清除已有定时器
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
      }
      
      // 只在auto模式下启动定时器
      if (this.currentMode === 'auto') {
        this.updateTimer = setInterval(function() {
          var newTheme = self.getCurrentTheme();
          if (newTheme !== self.currentTheme) {
            LifeGame.log('[ThemeManager] 时间变化，切换到:', newTheme);
            self.applyTheme();
          }
        }, THEME_UPDATE_INTERVAL);
      }
    },
    
    // 停止自动更新
    stopAutoUpdate: function() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
      }
    },
    
    // 注入主题相关样式
    injectThemeStyles: function() {
      // 检查是否已注入
      if (document.getElementById('theme-manager-styles')) return;
      
      var style = document.createElement('style');
      style.id = 'theme-manager-styles';
      style.textContent = [
        '/* 主题切换过渡动画 */',
        'body, #app, .glass-card, .nav-bar {',
        '  transition: background 0.5s ease, color 0.3s ease, border-color 0.3s ease;',
        '}',
        '',
        '/* 主题切换按钮样式 */',
        '.theme-switcher {',
        '  display: flex;',
        '  gap: 8px;',
        '  padding: 12px;',
        '  background: var(--card);',
        '  border-radius: 12px;',
        '  margin: 16px;',
        '}',
        '',
        '.theme-btn {',
        '  flex: 1;',
        '  padding: 10px 16px;',
        '  border: 2px solid transparent;',
        '  border-radius: 8px;',
        '  font-size: 13px;',
        '  cursor: pointer;',
        '  transition: all 0.3s ease;',
        '  background: rgba(128, 128, 128, 0.1);',
        '  color: var(--text2);',
        '}',
        '',
        '.theme-btn:hover {',
        '  transform: translateY(-2px);',
        '}',
        '',
        '.theme-btn.active {',
        '  border-color: var(--accent);',
        '  background: rgba(56, 189, 248, 0.2);',
        '  color: var(--accent);',
        '  font-weight: 600;',
        '}',
        '',
        '.theme-btn .icon {',
        '  margin-right: 4px;',
        '}',
        '',
        '/* 当前主题状态显示 */',
        '.theme-status-bar {',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  gap: 8px;',
        '  padding: 8px 16px;',
        '  font-size: 12px;',
        '  color: var(--text2);',
        '  background: var(--card);',
        '  border-radius: 20px;',
        '  margin: 0 16px 16px;',
        '}',
        '',
        '/* 浅色主题下的特殊调整 */',
        '[data-theme="noon"] .task-card,',
        '[data-theme="morning"] .task-card,',
        '[data-theme="afternoon"] .task-card {',
        '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);',
        '}',
        '',
        '[data-theme="evening"] .nav-bar {',
        '  border-top-color: rgba(255, 255, 255, 0.1);',
        '}'
      ].join('\n');
      
      document.head.appendChild(style);
    },
    
    // 渲染主题切换UI
    renderThemeSwitcher: function() {
      var isAuto = this.currentMode === 'auto';
      var isLight = this.currentMode === 'light';
      var isDark = this.currentMode === 'dark';
      
      var config = THEME_CONFIG[this.currentTheme];
      var statusText = isAuto ? config.icon + ' 自动 · ' + config.name : 
                       isLight ? '☀️ 固定白天' : '🌙 固定黑夜';
      
      return [
        '<div class="theme-switcher">',
          '<button class="theme-btn ' + (isAuto ? 'active' : '') + '" onclick="LifeGame.ThemeManager.setMode(\'auto\')">',
            '<span class="icon">🔄</span>自动',
          '</button>',
          '<button class="theme-btn ' + (isLight ? 'active' : '') + '" onclick="LifeGame.ThemeManager.setMode(\'light\')">',
            '<span class="icon">☀️</span>白天',
          '</button>',
          '<button class="theme-btn ' + (isDark ? 'active' : '') + '" onclick="LifeGame.ThemeManager.setMode(\'dark\')">',
            '<span class="icon">🌙</span>黑夜',
          '</button>',
        '</div>',
        '<div class="theme-status-bar">',
          statusText,
        '</div>'
      ].join('');
    },
    
    // 获取当前主题信息
    getInfo: function() {
      var config = THEME_CONFIG[this.currentTheme];
      return {
        mode: this.currentMode,
        theme: this.currentTheme,
        name: config.name,
        icon: config.icon,
        hour: new Date().getHours()
      };
    }
  };
  
  // 注册到全局
  if (typeof LifeGame !== 'undefined') {
    LifeGame.ThemeManager = ThemeManager;
    
    // 监听应用就绪事件
    LifeGame.on('app:ready', function() {
      ThemeManager.init();
    });
  }
  
  // 也暴露到全局供直接访问
  window.ThemeManager = ThemeManager;
})();
