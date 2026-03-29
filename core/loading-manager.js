/**
 * Loading Manager - 全局加载状态管理器
 * 提供统一的加载状态指示，避免用户困惑
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'loading-manager';
  
  var LoadingManager = {
    // 当前加载队列
    _queue: [],
    
    // DOM 元素引用
    _overlay: null,
    _text: null,
    _spinner: null,
    
    // 是否已初始化
    _initialized: false,
    
    /**
     * 初始化加载管理器
     */
    init: function() {
      if (this._initialized) return;
      
      this._createElements();
      this._bindEvents();
      
      this._initialized = true;
      LifeGame.log('[LoadingManager] 初始化完成');
    },
    
    /**
     * 创建加载指示器 DOM 元素
     */
    _createElements: function() {
      // 检查是否已存在
      if (document.getElementById('lg-loading-overlay')) {
        this._overlay = document.getElementById('lg-loading-overlay');
        this._text = document.getElementById('lg-loading-text');
        this._spinner = document.getElementById('lg-loading-spinner');
        return;
      }
      
      // 创建遮罩层
      var overlay = document.createElement('div');
      overlay.id = 'lg-loading-overlay';
      overlay.className = 'lg-loading-overlay';
      overlay.style.cssText = 
        'position:fixed;' +
        'top:0;' +
        'left:0;' +
        'width:100%;' +
        'height:100%;' +
        'background:rgba(10,10,26,0.85);' +
        'backdrop-filter:blur(8px);' +
        'display:flex;' +
        'flex-direction:column;' +
        'align-items:center;' +
        'justify-content:center;' +
        'z-index:9999;' +
        'opacity:0;' +
        'visibility:hidden;' +
        'transition:opacity 0.3s ease,visibility 0.3s ease;';
      
      // 创建加载动画容器
      var spinnerContainer = document.createElement('div');
      spinnerContainer.id = 'lg-loading-spinner';
      spinnerContainer.className = 'lg-loading-spinner';
      spinnerContainer.style.cssText = 
        'position:relative;' +
        'width:80px;' +
        'height:80px;' +
        'margin-bottom:20px;';
      
      // 创建多层旋转环
      var rings = [
        { color: '#38bdf8', size: 80, duration: '2s', delay: '0s' },
        { color: '#818cf8', size: 60, duration: '1.5s', delay: '0.2s' },
        { color: '#f59e0b', size: 40, duration: '1s', delay: '0.4s' }
      ];
      
      rings.forEach(function(ring, index) {
        var el = document.createElement('div');
        el.style.cssText = 
          'position:absolute;' +
          'top:50%;' +
          'left:50%;' +
          'width:' + ring.size + 'px;' +
          'height:' + ring.size + 'px;' +
          'margin-top:-' + (ring.size/2) + 'px;' +
          'margin-left:-' + (ring.size/2) + 'px;' +
          'border:3px solid transparent;' +
          'border-top-color:' + ring.color + ';' +
          'border-radius:50%;' +
          'animation:lg-spin ' + ring.duration + ' linear infinite;' +
          'animation-delay:' + ring.delay + ';' +
          'box-shadow:0 0 10px ' + ring.color + ';';
        spinnerContainer.appendChild(el);
      });
      
      // 创建文字
      var text = document.createElement('div');
      text.id = 'lg-loading-text';
      text.className = 'lg-loading-text';
      text.textContent = '加载中...';
      text.style.cssText = 
        'color:#f1f5f9;' +
        'font-size:16px;' +
        'font-weight:500;' +
        'text-align:center;' +
        'text-shadow:0 2px 4px rgba(0,0,0,0.5);' +
        'transition:all 0.3s ease;';
      
      // 创建进度条容器
      var progressContainer = document.createElement('div');
      progressContainer.className = 'lg-loading-progress-container';
      progressContainer.style.cssText = 
        'width:200px;' +
        'height:4px;' +
        'background:rgba(255,255,255,0.1);' +
        'border-radius:2px;' +
        'margin-top:16px;' +
        'overflow:hidden;' +
        'opacity:0;' +
        'transition:opacity 0.3s ease;';
      
      var progressBar = document.createElement('div');
      progressBar.id = 'lg-loading-progress';
      progressBar.className = 'lg-loading-progress';
      progressBar.style.cssText = 
        'width:0%;' +
        'height:100%;' +
        'background:linear-gradient(90deg,#38bdf8,#818cf8);' +
        'border-radius:2px;' +
        'transition:width 0.3s ease;' +
        'box-shadow:0 0 10px rgba(56,189,248,0.5);';
      
      progressContainer.appendChild(progressBar);
      
      // 组装
      overlay.appendChild(spinnerContainer);
      overlay.appendChild(text);
      overlay.appendChild(progressContainer);
      
      document.body.appendChild(overlay);
      
      // 添加动画样式
      if (!document.getElementById('lg-loading-styles')) {
        var style = document.createElement('style');
        style.id = 'lg-loading-styles';
        style.textContent = 
          '@keyframes lg-spin {' +
            '0% { transform:rotate(0deg); }' +
            '100% { transform:rotate(360deg); }' +
          '}' +
          '@keyframes lg-pulse {' +
            '0%,100% { opacity:0.6; }' +
            '50% { opacity:1; }' +
          '}' +
          '.lg-loading-overlay.active {' +
            'opacity:1 !important;' +
            'visibility:visible !important;' +
          '}' +
          '.lg-loading-text.pulse {' +
            'animation:lg-pulse 1.5s ease-in-out infinite;' +
          '}';
        document.head.appendChild(style);
      }
      
      this._overlay = overlay;
      this._text = text;
      this._progressBar = progressBar;
      this._progressContainer = progressContainer;
    },
    
    /**
     * 绑定事件
     */
    _bindEvents: function() {
      var self = this;
      
      // 监听 ESC 键关闭（如果允许）
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self._queue.length > 0) {
          // ESC 可以取消某些非关键加载
          LifeGame.log('[LoadingManager] 用户尝试取消加载');
        }
      });
      
      // 监听窗口失去焦点，暂停某些加载提示
      window.addEventListener('blur', function() {
        // 可以在这里添加逻辑
      });
    },
    
    /**
     * 显示加载状态
     * @param {string} text - 加载提示文字
     * @param {Object} options - 配置选项
     * @param {boolean} options.showProgress - 是否显示进度条
     * @param {boolean} options.blocking - 是否阻止用户交互（默认true）
     * @returns {string} 加载ID，用于后续关闭
     */
    show: function(text, options) {
      options = options || {};
      text = text || '加载中...';
      
      // 确保已初始化
      if (!this._initialized) {
        this.init();
      }
      
      // 生成唯一ID
      var id = 'load_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 添加到队列
      this._queue.push({
        id: id,
        text: text,
        options: options,
        startTime: Date.now()
      });
      
      // 更新显示
      this._updateDisplay();
      
      LifeGame.log('[LoadingManager] 显示加载:', text, '[ID:', id, ']');
      
      return id;
    },
    
    /**
     * 隐藏加载状态
     * @param {string} id - 加载ID（可选，不提供则关闭最后一个）
     */
    hide: function(id) {
      if (this._queue.length === 0) return;
      
      if (id) {
        // 移除指定ID
        var index = this._queue.findIndex(function(item) {
          return item.id === id;
        });
        if (index > -1) {
          var duration = Date.now() - this._queue[index].startTime;
          LifeGame.log('[LoadingManager] 关闭加载:', this._queue[index].text, 
                       '耗时:', duration + 'ms');
          this._queue.splice(index, 1);
        }
      } else {
        // 移除最后一个
        var item = this._queue.pop();
        if (item) {
          var duration = Date.now() - item.startTime;
          LifeGame.log('[LoadingManager] 关闭加载:', item.text, 
                       '耗时:', duration + 'ms');
        }
      }
      
      // 更新显示
      this._updateDisplay();
    },
    
    /**
     * 更新加载显示状态
     */
    _updateDisplay: function() {
      if (this._queue.length === 0) {
        // 隐藏
        if (this._overlay) {
          this._overlay.classList.remove('active');
          this._text.classList.remove('pulse');
        }
      } else {
        // 显示最后一个的文本
        var current = this._queue[this._queue.length - 1];
        if (this._text) {
          this._text.textContent = current.text;
          this._text.classList.add('pulse');
        }
        
        // 显示/隐藏进度条
        if (this._progressContainer) {
          this._progressContainer.style.opacity = current.options.showProgress ? '1' : '0';
        }
        
        // 显示遮罩
        if (this._overlay) {
          this._overlay.classList.add('active');
        }
      }
    },
    
    /**
     * 更新加载文字
     * @param {string} text - 新文字
     * @param {string} id - 加载ID（可选）
     */
    updateText: function(text, id) {
      if (this._queue.length === 0) return;
      
      if (id) {
        var item = this._queue.find(function(item) {
          return item.id === id;
        });
        if (item) {
          item.text = text;
        }
      } else {
        this._queue[this._queue.length - 1].text = text;
      }
      
      this._updateDisplay();
    },
    
    /**
     * 更新进度条
     * @param {number} percent - 进度百分比 (0-100)
     * @param {string} id - 加载ID（可选）
     */
    updateProgress: function(percent, id) {
      if (!this._progressBar) return;
      
      percent = Math.max(0, Math.min(100, percent));
      this._progressBar.style.width = percent + '%';
      
      // 更新队列中的进度
      if (id) {
        var item = this._queue.find(function(item) {
          return item.id === id;
        });
        if (item) {
          item.progress = percent;
        }
      } else if (this._queue.length > 0) {
        this._queue[this._queue.length - 1].progress = percent;
      }
    },
    
    /**
     * 显示带Promise的加载状态
     * @param {Promise} promise - 要执行的Promise
     * @param {string} text - 加载提示文字
     * @returns {Promise} 原Promise
     */
    wrap: function(promise, text) {
      var id = this.show(text);
      
      var self = this;
      return promise
        .finally(function() {
          self.hide(id);
        });
    },
    
    /**
     * 显示短暂的成功提示
     * @param {string} text - 提示文字
     * @param {number} duration - 显示时长(ms)
     */
    showSuccess: function(text, duration) {
      duration = duration || 1500;
      
      var id = this.show(text, { blocking: false });
      
      // 更改图标为成功
      if (this._spinner) {
        this._spinner.innerHTML = '<div style="font-size:60px;color:#22c55e;text-shadow:0 0 20px rgba(34,197,94,0.8);">✓</div>';
      }
      
      var self = this;
      setTimeout(function() {
        self.hide(id);
        // 恢复spinner
        if (self._spinner) {
          self._createElements(); // 重新创建spinner
        }
      }, duration);
    },
    
    /**
     * 获取当前加载队列长度
     * @returns {number}
     */
    getQueueLength: function() {
      return this._queue.length;
    },
    
    /**
     * 强制关闭所有加载状态
     */
    hideAll: function() {
      this._queue = [];
      this._updateDisplay();
      LifeGame.log('[LoadingManager] 已关闭所有加载状态');
    },
    
    /**
     * 清理资源
     */
    destroy: function() {
      this.hideAll();
      
      if (this._overlay && this._overlay.parentNode) {
        this._overlay.parentNode.removeChild(this._overlay);
      }
      
      var style = document.getElementById('lg-loading-styles');
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
      
      this._overlay = null;
      this._text = null;
      this._spinner = null;
      this._progressBar = null;
      this._progressContainer = null;
      this._initialized = false;
    }
  };
  
  // 注册模块
  LifeGame.registerModule(MODULE_NAME, LoadingManager);
  
  // 创建全局快捷方法
  LifeGame.showLoading = function(text, options) {
    return LoadingManager.show(text, options);
  };
  
  LifeGame.hideLoading = function(id) {
    LoadingManager.hide(id);
  };
  
  LifeGame.updateLoading = function(text, id) {
    LoadingManager.updateText(text, id);
  };
  
  LifeGame.showSuccess = function(text, duration) {
    LoadingManager.showSuccess(text, duration);
  };
  
})();
