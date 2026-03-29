/**
 * Drag Mouse - 使用鼠标事件模拟拖拽（完全避开 HTML5 Drag and Drop）
 * 适用于 Drag and Drop API 有问题的环境
 */
(function() {
  'use strict';
  
  var DragMouse = {
    draggedItem: null,
    placeholder: null,
    container: null,
    startPos: { x: 0, y: 0 },
    isDragging: false,
    mouseOffset: { x: 0, y: 0 },
    clone: null,
    originalNextSibling: null,
    pendingItem: null,
    dragStartTimer: null,
    onReorder: null,
    storageKey: null,
    itemSelector: null,
    // 存储全局事件监听器引用，用于清理
    _globalListeners: [],
    _itemListeners: [],
    
    init: function(container, itemSelector, storageKey, onReorder) {
      var self = this;
      var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      
      if (!containerEl) {
        console.error('[DragMouse] 容器未找到');
        return;
      }
      
      // 先清理旧的事件监听器，防止重复绑定
      this.destroy();
      
      LifeGame.log('[DragMouse] 初始化:', itemSelector);
      
      var items = containerEl.querySelectorAll(itemSelector);
      LifeGame.log('[DragMouse] 找到', items.length, '个元素');
      
      // 存储配置
      this.container = containerEl;
      this.itemSelector = itemSelector;
      this.storageKey = storageKey;
      this.onReorder = onReorder;
      
      // 禁用默认拖拽行为
      items.forEach(function(item) {
        item.draggable = false;
        item.style.cursor = 'grab';
        item.style.userSelect = 'none';
        
        // 鼠标按下
        var mousedownHandler = function(e) {
          if (e.button !== 0) return;
          
          // 记录按下时间和位置
          self.pendingItem = item;
          self.mouseDownTime = Date.now();
          self.mouseDownPos = { x: e.clientX, y: e.clientY };
          
          // 延迟启动拖拽（200ms 给双击留出时间）
          self.dragStartTimer = setTimeout(function() {
            if (self.pendingItem) {
              self.startDrag(item, e);
            }
          }, 200);
          
          // 不立即 preventDefault，让其他处理器有机会响应
        };
        
        // 鼠标释放
        var mouseupHandler = function(e) {
          // 清除启动定时器
          if (self.dragStartTimer) {
            clearTimeout(self.dragStartTimer);
            self.dragStartTimer = null;
          }
          
          // 如果没有启动拖拽，只是快速点击
          if (self.pendingItem && !self.isDragging) {
            self.pendingItem = null;
            return;
          }
          
          // 如果正在拖拽，处理放置
          if (self.isDragging) {
            self.handleDrop();
          }
        };
        
        item.addEventListener('mousedown', mousedownHandler);
        item.addEventListener('mouseup', mouseupHandler);
        
        // 存储引用以便清理
        self._itemListeners.push({
          element: item,
          mousedown: mousedownHandler,
          mouseup: mouseupHandler
        });
      });
      
      // 全局鼠标移动（拖拽中）
      var globalMousemoveHandler = function(e) {
        if (!self.isDragging || !self.draggedItem) return;
        
        // 更新克隆元素位置
        if (self.clone) {
          self.clone.style.left = (e.clientX - self.mouseOffset.x) + 'px';
          self.clone.style.top = (e.clientY - self.mouseOffset.y) + 'px';
        }
        
        // 查找目标位置
        if (self.clone) self.clone.style.display = 'none';
        var elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        if (self.clone) self.clone.style.display = '';
        
        if (!elemBelow) return;
        
        var target = elemBelow.closest(itemSelector);
        if (!target || target === self.draggedItem || !self.container.contains(target)) return;
        
        var rect = target.getBoundingClientRect();
        var midpoint = rect.top + rect.height / 2;
        
        // 移动占位符
        if (e.clientY < midpoint) {
          if (self.placeholder.nextSibling !== target) {
            self.container.insertBefore(self.placeholder, target);
          }
        } else {
          if (target.nextSibling !== self.placeholder) {
            self.container.insertBefore(self.placeholder, target.nextSibling);
          }
        }
      };
      
      // 全局鼠标释放（安全网）
      var globalMouseupHandler = function(e) {
        if (!self.isDragging) return;
        
        // 如果鼠标释放在卡片外，也处理放置
        if (self.draggedItem) {
          self.handleDrop();
        }
      };
      
      document.addEventListener('mousemove', globalMousemoveHandler);
      document.addEventListener('mouseup', globalMouseupHandler);
      
      // 存储全局事件监听器引用
      this._globalListeners = [
        { type: 'mousemove', handler: globalMousemoveHandler },
        { type: 'mouseup', handler: globalMouseupHandler }
      ];
      
      LifeGame.log('[DragMouse] 初始化完成');
    },
    
    /**
     * 清理所有事件监听器
     * 在重新初始化或销毁组件时调用，防止内存泄漏
     */
    destroy: function() {
      // 清理全局事件监听器
      if (this._globalListeners && this._globalListeners.length > 0) {
        this._globalListeners.forEach(function(listener) {
          document.removeEventListener(listener.type, listener.handler);
        });
        this._globalListeners = [];
      }
      
      // 清理项目上的事件监听器
      if (this._itemListeners && this._itemListeners.length > 0) {
        this._itemListeners.forEach(function(itemListener) {
          itemListener.element.removeEventListener('mousedown', itemListener.mousedown);
          itemListener.element.removeEventListener('mouseup', itemListener.mouseup);
        });
        this._itemListeners = [];
      }
      
      // 清理定时器
      if (this.dragStartTimer) {
        clearTimeout(this.dragStartTimer);
        this.dragStartTimer = null;
      }
      
      LifeGame.log('[DragMouse] 已清理所有事件监听器');
    },
    
    startDrag: function(item, e) {
      LifeGame.log('[DragMouse] 启动拖拽');
      
      this.draggedItem = item;
      this.isDragging = true;
      this.pendingItem = null;
      
      var rect = item.getBoundingClientRect();
      this.mouseOffset.x = e.clientX - rect.left;
      this.mouseOffset.y = e.clientY - rect.top;
      
      // 创建占位符
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'drag-placeholder-mouse';
      this.placeholder.style.cssText = 
        'background:linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4));' +
        'border:3px dashed #3b82f6;' +
        'border-radius:12px;' +
        'height:' + item.offsetHeight + 'px;' +
        'margin-bottom:12px;' +
        'box-shadow:0 0 30px rgba(59,130,246,0.8);' +
        'transition:all 0.2s;';
      
      if (item.nextSibling) {
        item.parentNode.insertBefore(this.placeholder, item.nextSibling);
      } else {
        item.parentNode.appendChild(this.placeholder);
      }
      
      // 创建克隆元素
      this.clone = item.cloneNode(true);
      this.clone.style.cssText = 
        'position:fixed;' +
        'left:' + rect.left + 'px;' +
        'top:' + rect.top + 'px;' +
        'width:' + rect.width + 'px;' +
        'height:' + rect.height + 'px;' +
        'z-index:9999;' +
        'opacity:0.95;' +
        'transform:scale(1.05) rotate(2deg);' +
        'box-shadow:0 20px 50px rgba(0,0,0,0.5);' +
        'pointer-events:none;' +
        'cursor:grabbing;';
      
      document.body.appendChild(this.clone);
      item.style.visibility = 'hidden';
    },
    
    handleDrop: function() {
      LifeGame.log('[DragMouse] 放置');
      
      // 移动元素到占位符位置
      this.container.insertBefore(this.draggedItem, this.placeholder);
      
      // 移除占位符
      if (this.placeholder && this.placeholder.parentNode) {
        this.placeholder.parentNode.removeChild(this.placeholder);
      }
      
      // 移除克隆
      if (this.clone && this.clone.parentNode) {
        this.clone.parentNode.removeChild(this.clone);
      }
      
      // 恢复原元素可见
      this.draggedItem.style.visibility = '';
      
      // 获取新排序
      var items = Array.from(this.container.querySelectorAll(this.itemSelector));
      var newOrder = items.map(function(i) {
        return i.dataset.taskId || i.dataset.subtaskId || i.dataset.id || i.id;
      }).filter(Boolean);
      
      LifeGame.log('[DragMouse] 新排序:', newOrder);
      
      // 回调
      if (this.onReorder) {
        this.onReorder(newOrder);
      }
      
      // 保存
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(newOrder));
        LifeGame.log('[DragMouse] 排序已保存');
      } catch(err) {
        console.error('[DragMouse] 保存失败:', err);
      }
      
      // 视觉反馈
      this.draggedItem.style.transition = 'transform 0.3s, box-shadow 0.3s';
      this.draggedItem.style.transform = 'scale(1.02)';
      this.draggedItem.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.8)';
      var self = this;
      setTimeout(function() {
        if (self.draggedItem) {
          self.draggedItem.style.transform = '';
          self.draggedItem.style.boxShadow = '';
          self.draggedItem.style.transition = '';
        }
      }, 300);
      
      // 重置状态
      this.draggedItem = null;
      this.placeholder = null;
      this.clone = null;
      this.isDragging = false;
      this.pendingItem = null;
    }
  };
  
  window.DragMouse = DragMouse;
})();
