/**
 * Undo Manager - 操作撤销管理器
 * 提供全局的撤销/重做功能
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'undo-manager';
  
  var UndoManager = {
    // 操作历史栈
    _history: [],
    
    // 最大保存的操作数
    _maxHistory: 20,
    
    // 当前显示的撤销提示
    _currentToast: null,
    
    // 撤销提示自动消失定时器
    _toastTimer: null,
    
    /**
     * 初始化
     */
    init: function() {
      LifeGame.log('[UndoManager] 初始化');
      this._createToastElement();
    },
    
    /**
     * 创建撤销提示元素
     */
    _createToastElement: function() {
      // 检查是否已存在
      if (document.getElementById('undo-toast')) {
        return;
      }
      
      var toast = document.createElement('div');
      toast.id = 'undo-toast';
      toast.className = 'undo-toast';
      toast.style.cssText = 
        'position:fixed;' +
        'bottom:80px;' +
        'left:50%;' +
        'transform:translateX(-50%) translateY(100px);' +
        'background:rgba(30, 41, 59, 0.95);' +
        'backdrop-filter:blur(10px);' +
        'border:1px solid rgba(56, 189, 248, 0.3);' +
        'border-radius:12px;' +
        'padding:12px 20px;' +
        'display:flex;' +
        'align-items:center;' +
        'gap:16px;' +
        'box-shadow:0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(56,189,248,0.2);' +
        'z-index:9999;' +
        'opacity:0;' +
        'transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' +
        'pointer-events:none;';
      
      toast.innerHTML = 
        '<span class="undo-toast-message" style="color:#f1f5f9;font-size:14px;font-weight:500;"></span>' +
        '<button class="undo-toast-btn" style="' +
          'background:linear-gradient(135deg, #38bdf8, #818cf8);' +
          'border:none;' +
          'border-radius:8px;' +
          'padding:8px 16px;' +
          'color:#0f172a;' +
          'font-size:13px;' +
          'font-weight:600;' +
          'cursor:pointer;' +
          'display:flex;' +
          'align-items:center;' +
          'gap:6px;' +
          'transition:all 0.2s;' +
          'pointer-events:auto;' +
        '">↩ 撤销</button>';
      
      document.body.appendChild(toast);
      
      // 绑定撤销按钮点击
      var self = this;
      toast.querySelector('.undo-toast-btn').addEventListener('click', function() {
        self.undo();
      });
      
      this._currentToast = toast;
    },
    
    /**
     * 添加可撤销的操作
     * @param {string} type - 操作类型: 'delete', 'complete', 'update'
     * @param {string} message - 显示的消息
     * @param {Function} undoFn - 撤销时要执行的函数
     * @param {Object} data - 操作相关的数据
     */
    add: function(type, message, undoFn, data) {
      // 清除之前的定时器
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
      }
      
      // 创建操作记录
      var action = {
        id: 'undo_' + Date.now(),
        type: type,
        message: message,
        undoFn: undoFn,
        data: data,
        timestamp: Date.now()
      };
      
      // 添加到历史栈
      this._history.push(action);
      
      // 限制历史记录数量
      if (this._history.length > this._maxHistory) {
        this._history.shift();
      }
      
      // 显示撤销提示
      this._showToast(message);
      
      LifeGame.log('[UndoManager] 添加操作:', type, message);
      
      return action.id;
    },
    
    /**
     * 显示撤销提示
     */
    _showToast: function(message) {
      if (!this._currentToast) {
        this._createToastElement();
      }
      
      var toast = this._currentToast;
      toast.querySelector('.undo-toast-message').textContent = message;
      
      // 显示动画
      requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.pointerEvents = 'auto';
      });
      
      // 5秒后自动隐藏
      var self = this;
      this._toastTimer = setTimeout(function() {
        self._hideToast();
      }, 5000);
    },
    
    /**
     * 隐藏撤销提示
     */
    _hideToast: function() {
      if (!this._currentToast) return;
      
      var toast = this._currentToast;
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.pointerEvents = 'none';
    },
    
    /**
     * 执行撤销
     */
    undo: function() {
      if (this._history.length === 0) {
        LifeGame.log('[UndoManager] 没有可撤销的操作');
        return false;
      }
      
      // 获取最后一个操作
      var action = this._history.pop();
      
      // 隐藏提示
      this._hideToast();
      
      // 清除定时器
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
      
      // 执行撤销函数
      try {
        action.undoFn(action.data);
        LifeGame.log('[UndoManager] 撤销成功:', action.type);
        
        // 触发撤销事件
        LifeGame.emit('undo:executed', {
          type: action.type,
          message: action.message
        });
        
        // 显示成功提示
        if (LifeGame.showSuccess) {
          LifeGame.showSuccess('↩ 已撤销');
        }
        
        return true;
      } catch (e) {
        console.error('[UndoManager] 撤销失败:', e);
        return false;
      }
    },
    
    /**
     * 获取可撤销的操作数量
     */
    getHistoryCount: function() {
      return this._history.length;
    },
    
    /**
     * 清空历史
     */
    clear: function() {
      this._history = [];
      this._hideToast();
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
      LifeGame.log('[UndoManager] 历史已清空');
    },
    
    /**
     * 是否可以撤销
     */
    canUndo: function() {
      return this._history.length > 0;
    }
  };
  
  // 注册模块
  LifeGame.registerModule(MODULE_NAME, UndoManager);
  
  // 全局快捷方法
  LifeGame.undo = function() {
    return UndoManager.undo();
  };
  
  LifeGame.addUndoable = function(type, message, undoFn, data) {
    return UndoManager.add(type, message, undoFn, data);
  };
  
})();
