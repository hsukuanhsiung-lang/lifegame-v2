/**
 * Color Theme Manager - 黑红/金红配色主题系统
 * 
 * 作为 ThemeManager 的风格覆盖层：
 * - ThemeManager 管理时间主题（morning/noon/night/midnight）的亮度和基础色调
 * - ColorThemeManager 管理配色风格（黑红/金红）的强调色系
 * - 两者叠加形成最终视觉效果
 * 
 * 使用方式：通过 body class 切换 (.theme-black-red / .theme-gold-red)
 */

(function() {
  'use strict';
  
  var COLOR_THEME_KEY = 'lifegame_color_theme';
  
  var ColorThemeManager = {
    currentTheme: 'gold-red', // 默认金红
    
    init: function() {
      LifeGame.log('[ColorThemeManager] 初始化');
      this.loadSavedTheme();
      this.applyThemeClass(this.currentTheme);
      this.injectColorStyles();
    },
    
    // 加载保存的主题
    loadSavedTheme: function() {
      var saved = localStorage.getItem(COLOR_THEME_KEY);
      if (saved && (saved === 'black-red' || saved === 'gold-red')) {
        this.currentTheme = saved;
      }
      LifeGame.log('[ColorThemeManager] 加载保存的主题:', this.currentTheme);
    },
    
    // 保存主题
    saveTheme: function(themeName) {
      this.currentTheme = themeName;
      localStorage.setItem(COLOR_THEME_KEY, themeName);
      LifeGame.log('[ColorThemeManager] 保存主题:', themeName);
    },
    
    // 应用主题（通过 body class）
    applyThemeClass: function(themeName) {
      // 移除旧主题
      document.body.classList.remove('theme-black-red', 'theme-gold-red');
      // 添加新主题
      document.body.classList.add('theme-' + themeName);
      // 设置 data 属性便于 CSS 选择
      document.body.dataset.colorTheme = themeName;
      
      LifeGame.log('[ColorThemeManager] 应用主题 class:', themeName);
    },
    
    // 设置主题（供外部调用）
    setTheme: function(themeName) {
      if (themeName !== 'black-red' && themeName !== 'gold-red') {
        console.error('[ColorThemeManager] 无效主题:', themeName);
        return;
      }
      
      this.saveTheme(themeName);
      this.applyThemeClass(themeName);
      
      // 触发主题变更事件
      LifeGame.emit('color-theme:changed', {
        theme: themeName
      });
    },
    
    // 获取当前主题
    getCurrentTheme: function() {
      return {
        name: this.currentTheme,
        label: this.currentTheme === 'gold-red' ? '💛❤️ 金红 - 奢华激励' : '🖤❤️ 黑红 - 冷酷专注'
      };
    },
    
    // 注入配色样式（通过 body class 控制）
    injectColorStyles: function() {
      if (document.getElementById('color-theme-styles')) return;
      
      var style = document.createElement('style');
      style.id = 'color-theme-styles';
      style.textContent = [
        '/* ============================================================ */',
        '/* Color Theme Styles - 黑红/金红配色主题系统 */',
        '/* ============================================================ */',
        '',
        '/* ========== 基础变量定义 ========== */',
        ':root {',
        '  /* 默认使用金红主题变量 */',
        '  --theme-accent: #f59e0b;',
        '  --theme-accent-secondary: #dc2626;',
        '  --theme-text-active: #fbbf24;',
        '  --theme-border-active: #f59e0b;',
        '  --theme-glow: 0 0 20px rgba(245, 158, 11, 0.2);',
        '  --theme-glow-strong: 0 0 25px rgba(245, 158, 11, 0.35);',
        '  --theme-gradient: linear-gradient(90deg, #b45309 0%, #dc2626 100%);',
        '  --theme-btn-orange: linear-gradient(90deg, #fbbf24, #f59e0b);',
        '}',
        '',
        '/* ========== 黑红主题变量覆盖 ========== */',
        'body.theme-black-red {',
        '  --theme-accent: #dc2626;',
        '  --theme-accent-secondary: #991b1b;',
        '  --theme-text-active: #ef4444;',
        '  --theme-border-active: #dc2626;',
        '  --theme-glow: 0 0 20px rgba(220, 38, 38, 0.15);',
        '  --theme-glow-strong: 0 0 25px rgba(220, 38, 38, 0.35);',
        '  --theme-gradient: linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%);',
        '  --theme-btn-orange: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);',
        '}',
        '',
        '/* ========== 应用变量到组件 ========== */',
        '',
        '/* 标签页样式 */',
        '.main-tab {',
        '  background: var(--card);',
        '  border: 1px solid var(--card-border);',
        '  color: var(--text2);',
        '}',
        '',
        '.main-tab:hover {',
        '  background: rgba(255,255,255,0.05);',
        '  color: var(--theme-text-active);',
        '}',
        '',
        '.main-tab.active {',
        '  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));',
        '  border-color: var(--theme-border-active);',
        '  color: var(--theme-text-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        'body.theme-gold-red .main-tab.active {',
        '  background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(26, 21, 10, 0.3) 100%);',
        '}',
        '',
        'body.theme-black-red .main-tab.active {',
        '  background: linear-gradient(180deg, rgba(220, 38, 38, 0.1) 0%, rgba(10, 10, 10, 0.3) 100%);',
        '}',
        '',
        '/* 筛选按钮样式 */',
        '.type-btn, .filter-btn, .date-btn {',
        '  background: var(--card);',
        '  border: 1px solid var(--card-border);',
        '  color: var(--text2);',
        '}',
        '',
        '.type-btn:hover, .filter-btn:hover, .date-btn:hover {',
        '  color: var(--theme-text-active);',
        '}',
        '',
        '.type-btn.active, .filter-btn.active, .date-btn.active {',
        '  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));',
        '  border-color: var(--theme-border-active);',
        '  color: var(--theme-text-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        '/* 添加按钮样式 */',
        '.add-task-btn {',
        '  background: var(--theme-gradient);',
        '  color: white;',
        '  text-shadow: 0 1px 2px rgba(0,0,0,0.3);',
        '}',
        '',
        '.add-task-btn:hover {',
        '  box-shadow: var(--theme-glow-strong);',
        '}',
        '',
        '.add-challenge-btn {',
        '  background: var(--theme-btn-orange);',
        '  color: white;',
        '  text-shadow: 0 1px 2px rgba(0,0,0,0.3);',
        '}',
        '',
        'body.theme-black-red .add-challenge-btn {',
        '  border: 1px solid var(--theme-border-active);',
        '  color: var(--theme-text-active);',
        '}',
        '',
        '/* 任务卡片 */',
        '.task-card-grid:hover, .task-card:hover {',
        '  border-color: var(--theme-border-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        '.task-chk {',
        '  border-color: var(--theme-accent);',
        '}',
        '',
        '.task-chk.done {',
        '  background: var(--theme-accent);',
        '}',
        '',
        '/* 挑战卡片 */',
        '.challenge-card:hover {',
        '  border-color: var(--theme-border-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        '.challenge-card.completed {',
        '  border-color: var(--theme-border-active);',
        '  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));',
        '}',
        '',
        '.challenge-card.completed .challenge-name,',
        '.challenge-card.completed .challenge-time {',
        '  color: var(--theme-text-active);',
        '}',
        '',
        '.challenge-check {',
        '  border-color: var(--card-border);',
        '}',
        '',
        '.challenge-card.completed .challenge-check {',
        '  background: var(--theme-accent);',
        '  border-color: var(--theme-accent);',
        '}',
        '',
        '.challenge-streak {',
        '  background: var(--theme-gradient);',
        '}',
        '',
        '/* 进度条 */',
        '.progress-fill {',
        '  background: var(--theme-gradient);',
        '}',
        '',
        '.progress-count {',
        '  color: var(--theme-accent);',
        '}',
        '',
        '/* 禁止事项卡片 */',
        '.forbid-card:hover {',
        '  border-color: var(--theme-border-active);',
        '}',
        '',
        '.forbid-card.protected {',
        '  border-color: var(--theme-border-active);',
        '}',
        '',
        '/* 导航栏激活状态 */',
        '.nav-item.active {',
        '  color: var(--theme-text-active);',
        '  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));',
        '}',
        '',
        '/* 设置页面标签 */',
        '.profile-tab.active {',
        '  background: var(--theme-gradient);',
        '}',
        '',
        '/* 主题选择器 */',
        '.theme-selector {',
        '  background: var(--card);',
        '  border: 1px solid var(--card-border);',
        '}',
        '',
        '.theme-select {',
        '  background: var(--bg);',
        '  border: 1px solid var(--card-border);',
        '  color: var(--text);',
        '}',
        '',
        '.theme-select:focus {',
        '  border-color: var(--theme-border-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        '.theme-preview {',
        '  background: var(--bg);',
        '  border: 1px solid var(--card-border);',
        '}',
        '',
        '.theme-preview-tab.active {',
        '  border-color: var(--theme-border-active);',
        '  color: var(--theme-text-active);',
        '  box-shadow: var(--theme-glow);',
        '}',
        '',
        '.theme-preview-btn {',
        '  background: var(--theme-gradient);',
        '}',
        '',
        '/* 设置分区标题 */',
        '.settings-section-title {',
        '  color: var(--text);',
        '  border-bottom: 1px solid var(--card-border);',
        '}',
        '',
        '/* 统计卡片 */',
        '.profile-level {',
        '  background: var(--theme-gradient);',
        '  color: white;',
        '}',
        '',
        '.stat-value {',
        '  color: var(--theme-accent);',
        '}',
        '',
        '/* 按钮悬停效果增强 */',
        '.task-btn:hover, .inbox-btn:hover, .toggle-subtasks:hover {',
        '  border-color: var(--theme-border-active);',
        '  color: var(--theme-text-active);',
        '}',
        '',
        '/* 表单元素聚焦 */',
        'input:focus, select:focus, textarea:focus {',
        '  border-color: var(--theme-border-active) !important;',
        '  box-shadow: var(--theme-glow) !important;',
        '  outline: none;',
        '}',
        '',
        '/* 经验进度条 */',
        '.exp-bar-fill {',
        '  background: var(--theme-gradient);',
        '}',
        '',
        '/* 子任务复选框 */',
        '.subtask-chk.done {',
        '  background: var(--theme-accent);',
        '  border-color: var(--theme-accent);',
        '}',
        '',
        '/* 长期任务完成状态 */',
        '.long-completeable {',
        '  border-color: var(--theme-border-active) !important;',
        '  color: var(--theme-text-active);',
        '  animation: pulse-glow-theme 2s infinite;',
        '}',
        '',
        '@keyframes pulse-glow-theme {',
        '  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }',
        '  50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }',
        '}',
        '',
        'body.theme-gold-red .long-completeable {',
        '  animation: pulse-glow-gold 2s infinite;',
        '}',
        '',
        '@keyframes pulse-glow-gold {',
        '  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }',
        '  50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); }',
        '}',
        '',
        '/* 拖拽排序占位符 */',
        '.drag-placeholder {',
        '  border-color: var(--theme-border-active);',
        '  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(220, 38, 38, 0.1));',
        '}',
        '',
        'body.theme-black-red .drag-placeholder {',
        '  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(153, 27, 27, 0.1));',
        '}',
        '',
        '/* 过渡动画 */',
        'body.theme-black-red, body.theme-gold-red,',
        'body.theme-black-red *, body.theme-gold-red * {',
        '  transition: background-color 0.4s ease, border-color 0.4s ease, color 0.3s ease, box-shadow 0.4s ease;',
        '}'
      ].join('\n');
      
      document.head.appendChild(style);
      LifeGame.log('[ColorThemeManager] 样式注入完成');
    },
    
    // 渲染主题选择器HTML
    renderThemeSelector: function() {
      var current = this.currentTheme;
      
      return [
        '<div class="theme-selector">',
          '<div class="theme-selector-label">主题配色</div>',
          '<select class="theme-select" id="color-theme-select" onchange="LifeGame.ColorThemeManager.setTheme(this.value)">',
            '<option value="gold-red"' + (current === 'gold-red' ? ' selected' : '') + '>💛❤️ 金红 - 奢华激励</option>',
            '<option value="black-red"' + (current === 'black-red' ? ' selected' : '') + '>🖤❤️ 黑红 - 冷酷专注</option>',
          '</select>',
          '<div class="theme-preview">',
            '<div class="theme-preview-title">实时预览</div>',
            '<div class="theme-preview-tabs">',
              '<div class="theme-preview-tab active">今日</div>',
              '<div class="theme-preview-tab">长期</div>',
            '</div>',
            '<button class="theme-preview-btn">+ 添加任务</button>',
          '</div>',
        '</div>'
      ].join('');
    }
  };
  
  // 注册到全局
  if (typeof LifeGame !== 'undefined') {
    LifeGame.ColorThemeManager = ColorThemeManager;
  }
  window.ColorThemeManager = ColorThemeManager;
  
  // 立即初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ColorThemeManager.init();
    });
  } else {
    ColorThemeManager.init();
  }
})();
