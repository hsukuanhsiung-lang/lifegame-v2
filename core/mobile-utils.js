/**
 * Mobile Utils - 移动端工具模块
 * 提供移动端检测、触摸事件、长按手势等功能
 */

(function() {
  'use strict';

  var MobileUtils = {
    // 缓存检测结果
    _isTouchDevice: null,
    _isIOS: null,
    _isAndroid: null,
    _isWeChat: null,
    
    /**
     * 初始化移动端工具
     */
    init: function() {
      this.preventDoubleTapZoom();
      this.preventContextMenu();
    },
    
    /**
     * 检测是否为触摸设备
     * @returns {boolean}
     */
    isTouchDevice: function() {
      if (this._isTouchDevice !== null) {
        return this._isTouchDevice;
      }
      this._isTouchDevice = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 ||
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return this._isTouchDevice;
    },
    
    /**
     * 检测是否为iOS设备
     * @returns {boolean}
     */
    isIOS: function() {
      if (this._isIOS !== null) {
        return this._isIOS;
      }
      this._isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return this._isIOS;
    },
    
    /**
     * 检测是否为Android设备
     * @returns {boolean}
     */
    isAndroid: function() {
      if (this._isAndroid !== null) {
        return this._isAndroid;
      }
      this._isAndroid = /Android/.test(navigator.userAgent);
      return this._isAndroid;
    },
    
    /**
     * 检测是否为微信浏览器
     * @returns {boolean}
     */
    isWeChat: function() {
      if (this._isWeChat !== null) {
        return this._isWeChat;
      }
      this._isWeChat = /MicroMessenger/i.test(navigator.userAgent);
      return this._isWeChat;
    },
    
    /**
     * 添加长按事件监听
     * @param {HTMLElement} element - 目标元素
     * @param {Function} handler - 处理函数
     * @param {number} duration - 长按持续时间（毫秒，默认500ms）
     * @returns {Object} 清理函数
     */
    addLongPressListener: function(element, handler, duration) {
      duration = duration || 500;
      var timer = null;
      var isLongPress = false;
      var startX = 0;
      var startY = 0;
      var maxMoveDistance = 10; // 允许的最大移动距离
      
      var clearTimer = function() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
      
      var onTouchStart = function(e) {
        isLongPress = false;
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        timer = setTimeout(function() {
          isLongPress = true;
          handler(e);
        }, duration);
      };
      
      var onTouchMove = function(e) {
        if (!timer) return;
        
        var touch = e.touches[0];
        var moveX = Math.abs(touch.clientX - startX);
        var moveY = Math.abs(touch.clientY - startY);
        
        // 移动距离过大，取消长按
        if (moveX > maxMoveDistance || moveY > maxMoveDistance) {
          clearTimer();
        }
      };
      
      var onTouchEnd = function(e) {
        clearTimer();
        // 如果是长按，阻止后续点击事件
        if (isLongPress) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      var onTouchCancel = function() {
        clearTimer();
      };
      
      element.addEventListener('touchstart', onTouchStart, { passive: true });
      element.addEventListener('touchmove', onTouchMove, { passive: true });
      element.addEventListener('touchend', onTouchEnd);
      element.addEventListener('touchcancel', onTouchCancel);
      
      // 返回清理函数
      return {
        destroy: function() {
          element.removeEventListener('touchstart', onTouchStart);
          element.removeEventListener('touchmove', onTouchMove);
          element.removeEventListener('touchend', onTouchEnd);
          element.removeEventListener('touchcancel', onTouchCancel);
        }
      };
    },
    
    /**
     * 添加双击事件（兼容移动端的双击）
     * @param {HTMLElement} element - 目标元素
     * @param {Function} handler - 处理函数
     * @returns {Object} 清理函数
     */
    addDoubleTapListener: function(element, handler) {
      var lastTapTime = 0;
      var tapTimeout = null;
      var tapCount = 0;
      
      var onTap = function(e) {
        var currentTime = new Date().getTime();
        var tapInterval = currentTime - lastTapTime;
        
        if (tapInterval < 300 && tapInterval > 0) {
          // 双击/双触
          clearTimeout(tapTimeout);
          tapCount = 0;
          handler(e);
        } else {
          // 单击/单触
          tapCount = 1;
          tapTimeout = setTimeout(function() {
            tapCount = 0;
          }, 300);
        }
        
        lastTapTime = currentTime;
      };
      
      var eventType = this.isTouchDevice() ? 'touchend' : 'click';
      element.addEventListener(eventType, onTap);
      
      return {
        destroy: function() {
          element.removeEventListener(eventType, onTap);
        }
      };
    },
    
    /**
     * 阻止双击缩放（防止移动端双击放大）
     */
    preventDoubleTapZoom: function() {
      var lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    },
    
    /**
     * 阻止默认上下文菜单（可选，用于自定义长按菜单）
     */
    preventContextMenu: function() {
      // 只在非输入框元素上阻止
      document.addEventListener('contextmenu', function(e) {
        if (!e.target.closest('input, textarea')) {
          e.preventDefault();
        }
      });
    },
    
    /**
     * 创建长按菜单
     * @param {Array} items - 菜单项 [{text: '编辑', action: fn, className: 'danger'}]
     * @param {Object} options - 配置 {x, y, onClose}
     * @returns {HTMLElement} 菜单元素
     */
    createContextMenu: function(items, options) {
      options = options || {};
      
      // 移除已存在的菜单
      var existingMenu = document.querySelector('.mobile-context-menu');
      if (existingMenu) {
        existingMenu.remove();
      }
      
      var menu = document.createElement('div');
      menu.className = 'mobile-context-menu';
      
      // 定位
      var x = options.x || 0;
      var y = options.y || 0;
      
      // 确保不超出屏幕
      var menuWidth = 150;
      var menuHeight = items.length * 44;
      
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }
      
      menu.style.cssText = 
        'position:fixed;' +
        'left:' + x + 'px;' +
        'top:' + y + 'px;' +
        'background:rgba(30,30,40,0.95);' +
        'backdrop-filter:blur(10px);' +
        'border-radius:12px;' +
        'padding:8px 0;' +
        'min-width:150px;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.4);' +
        'z-index:10000;' +
        'border:1px solid rgba(255,255,255,0.1);' +
        'animation:menuFadeIn 0.15s ease;';
      
      // 添加动画样式
      if (!document.getElementById('mobile-menu-styles')) {
        var style = document.createElement('style');
        style.id = 'mobile-menu-styles';
        style.textContent = 
          '@keyframes menuFadeIn {' +
          'from { opacity:0; transform:scale(0.95); }' +
          'to { opacity:1; transform:scale(1); }' +
          '}' +
          '.mobile-context-menu-item {' +
          'padding:12px 16px;' +
          'color:#fff;' +
          'font-size:15px;' +
          'cursor:pointer;' +
          'transition:background 0.15s;' +
          'display:flex;' +
          'align-items:center;' +
          'gap:10px;' +
          '}' +
          '.mobile-context-menu-item:hover, .mobile-context-menu-item:active {' +
          'background:rgba(255,255,255,0.1);' +
          '}' +
          '.mobile-context-menu-item.danger { color:#ff4757; }' +
          '.mobile-context-menu-divider {' +
          'height:1px;' +
          'background:rgba(255,255,255,0.1);' +
          'margin:8px 0;' +
          '}';
        document.head.appendChild(style);
      }
      
      // 创建菜单项
      items.forEach(function(item, index) {
        if (item === 'divider') {
          var divider = document.createElement('div');
          divider.className = 'mobile-context-menu-divider';
          menu.appendChild(divider);
        } else {
          var menuItem = document.createElement('div');
          menuItem.className = 'mobile-context-menu-item' + (item.className ? ' ' + item.className : '');
          menuItem.innerHTML = (item.icon || '') + item.text;
          menuItem.addEventListener('click', function(e) {
            e.stopPropagation();
            item.action();
            menu.remove();
            if (options.onClose) options.onClose();
          });
          menu.appendChild(menuItem);
        }
      });
      
      document.body.appendChild(menu);
      
      // 点击其他地方关闭菜单
      var closeHandler = function(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeHandler);
          document.removeEventListener('touchstart', closeHandler);
          if (options.onClose) options.onClose();
        }
      };
      
      setTimeout(function() {
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
      }, 10);
      
      return menu;
    },
    
    /**
     * 显示触摸反馈（波纹效果）
     * @param {HTMLElement} element - 目标元素
     * @param {TouchEvent|MouseEvent} e - 事件对象
     */
    showTouchFeedback: function(element, e) {
      var ripple = document.createElement('span');
      ripple.style.cssText = 
        'position:absolute;' +
        'border-radius:50%;' +
        'background:rgba(255,255,255,0.3);' +
        'pointer-events:none;' +
        'transform:scale(0);' +
        'animation:rippleEffect 0.4s linear;';
      
      var rect = element.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x, y;
      
      if (e.touches && e.touches[0]) {
        x = e.touches[0].clientX - rect.left - size / 2;
        y = e.touches[0].clientY - rect.top - size / 2;
      } else {
        x = e.clientX - rect.left - size / 2;
        y = e.clientY - rect.top - size / 2;
      }
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);
      
      setTimeout(function() {
        ripple.remove();
      }, 400);
    }
  };
  
  // 添加波纹动画样式
  var style = document.createElement('style');
  style.textContent = 
    '@keyframes rippleEffect {' +
    'to {' +
    'transform:scale(2);' +
    'opacity:0;' +
    '}' +
    '}';
  document.head.appendChild(style);
  
  // 暴露到全局
  window.MobileUtils = MobileUtils;
  if (typeof LifeGame !== 'undefined') {
    LifeGame.mobile = MobileUtils;
  }
  
  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      MobileUtils.init();
    });
  } else {
    MobileUtils.init();
  }
})();
