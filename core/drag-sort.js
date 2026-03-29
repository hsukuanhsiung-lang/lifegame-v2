/**
 * Drag Sort Module - 拖拽排序通用模块（移动端兼容版）
 * 
 * 支持：
 * 1. 桌面端：HTML5 Drag and Drop API
 * 2. 移动端：Touch 事件模拟拖拽
 * 3. 长按触发拖拽（移动端）
 * 
 * 使用方法不变，自动检测设备类型
 */

(function() {
  'use strict';
  
  var DragSort = {
    draggedItem: null,
    placeholder: null,
    container: null,
    itemSelector: null,
    startIndex: -1,
    containers: [],
    
    // 触摸相关状态
    touchState: {
      isTouch: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      longPressTimer: null,
      isDragging: false,
      clone: null
    },
    
    /**
     * 检测是否为触摸设备
     */
    isTouchDevice: function() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    /**
     * 初始化拖拽排序
     */
    init: function(container, itemSelector, storageKey, onReorder) {
      var self = this;
      var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      if (!containerEl) {
        LifeGame.warn('[DragSort] 容器未找到:', container);
        return;
      }
      
      // 存储容器配置
      containerEl._dragSortConfig = {
        itemSelector: itemSelector,
        storageKey: storageKey,
        onReorder: onReorder,
        container: containerEl
      };
      
      if (this.containers.indexOf(containerEl) === -1) {
        this.containers.push(containerEl);
      }
      
      // 同时支持触摸和鼠标拖拽
      // 触摸事件（移动端/触摸屏）
      this.setupTouchEvents(containerEl, itemSelector);
      // 鼠标拖拽事件（桌面端）
      this.setupDragEvents(containerEl, itemSelector);
      
      // 绑定全局事件（只绑定一次）
      this.bindGlobalEventsOnce();
      
      // 设置可拖拽样式（同时支持鼠标和触摸）
      var items = containerEl.querySelectorAll(itemSelector);
      items.forEach(function(item) {
        item.draggable = true;
        item.style.cursor = 'grab';
        item.style.userSelect = 'none';
        item.style.webkitUserSelect = 'none';
      });
    },
    
    /**
     * 设置触摸事件（移动端）
     */
    setupTouchEvents: function(containerEl, itemSelector) {
      var self = this;
      var longPressDuration = 400; // 长按触发拖拽的时间
      
      containerEl.addEventListener('touchstart', function(e) {
        var item = e.target.closest(itemSelector);
        if (!item || !containerEl.contains(item)) return;
        
        var touch = e.touches[0];
        self.touchState.startX = touch.clientX;
        self.touchState.startY = touch.clientY;
        self.touchState.isTouch = true;
        self.touchState.isDragging = false;
        
        // 开始长按计时
        self.touchState.longPressTimer = setTimeout(function() {
          // 触发拖拽开始
          self.touchState.isDragging = true;
          self.handleTouchDragStart(item, containerEl, touch);
          
          // 触发震动反馈（如果支持）
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, longPressDuration);
      }, { passive: true });
      
      containerEl.addEventListener('touchmove', function(e) {
        if (!self.touchState.isTouch) return;
        
        var touch = e.touches[0];
        self.touchState.currentX = touch.clientX;
        self.touchState.currentY = touch.clientY;
        
        var moveX = Math.abs(touch.clientX - self.touchState.startX);
        var moveY = Math.abs(touch.clientY - self.touchState.startY);
        
        // 如果移动距离过大，取消长按
        if (moveX > 10 || moveY > 10) {
          clearTimeout(self.touchState.longPressTimer);
        }
        
        // 正在拖拽中
        if (self.touchState.isDragging && self.draggedItem) {
          e.preventDefault();
          self.handleTouchDragMove(touch, containerEl, itemSelector);
        }
      }, { passive: false });
      
      containerEl.addEventListener('touchend', function(e) {
        clearTimeout(self.touchState.longPressTimer);
        
        if (self.touchState.isDragging && self.draggedItem) {
          e.preventDefault();
          self.handleTouchDragEnd(containerEl);
        }
        
        // 重置状态
        self.touchState.isTouch = false;
        self.touchState.isDragging = false;
      });
      
      containerEl.addEventListener('touchcancel', function() {
        clearTimeout(self.touchState.longPressTimer);
        if (self.touchState.isDragging) {
          self.handleTouchDragEnd(containerEl);
        }
        self.touchState.isTouch = false;
        self.touchState.isDragging = false;
      });
    },
    
    /**
     * 处理触摸拖拽开始
     */
    handleTouchDragStart: function(item, containerEl, touch) {
      this.draggedItem = item;
      this.container = containerEl;
      this._dropCompleted = false;
      
      var config = containerEl._dragSortConfig;
      var items = Array.from(containerEl.querySelectorAll(config.itemSelector));
      this.startIndex = items.indexOf(item);
      
      // 创建占位符
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'drag-placeholder';
      var rect = item.getBoundingClientRect();
      this.placeholder.style.height = rect.height + 'px';
      this.placeholder.style.width = rect.width + 'px';
      this.placeholder.style.marginBottom = '12px';
      this.placeholder.style.background = 'rgba(56, 189, 248, 0.1)';
      this.placeholder.style.border = '2px dashed rgba(56, 189, 248, 0.4)';
      this.placeholder.style.borderRadius = '12px';
      
      item.parentNode.insertBefore(this.placeholder, item);
      
      // 创建拖拽克隆元素
      this.touchState.clone = item.cloneNode(true);
      this.touchState.clone.style.position = 'fixed';
      this.touchState.clone.style.width = rect.width + 'px';
      this.touchState.clone.style.height = rect.height + 'px';
      this.touchState.clone.style.left = rect.left + 'px';
      this.touchState.clone.style.top = rect.top + 'px';
      this.touchState.clone.style.zIndex = '9999';
      this.touchState.clone.style.opacity = '0.9';
      this.touchState.clone.style.transform = 'scale(1.05)';
      this.touchState.clone.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
      this.touchState.clone.style.pointerEvents = 'none';
      this.touchState.clone.classList.add('dragging-clone');
      
      document.body.appendChild(this.touchState.clone);
      
      // 原元素半透明
      item.style.opacity = '0.3';
      item.classList.add('dragging-source');
      
      containerEl.classList.add('is-dragging');
      document.body.classList.add('dragging-active');
      
      LifeGame.log('[DragSort] 触摸拖拽开始:', item.dataset.taskId || item.dataset.id);
    },
    
    /**
     * 处理触摸拖拽移动
     */
    handleTouchDragMove: function(touch, containerEl, itemSelector) {
      if (!this.touchState.clone || !this.placeholder) return;
      
      // 更新克隆元素位置（跟随手指）
      var cloneRect = this.touchState.clone.getBoundingClientRect();
      var offsetX = cloneRect.width / 2;
      var offsetY = cloneRect.height / 2;
      
      this.touchState.clone.style.left = (touch.clientX - offsetX) + 'px';
      this.touchState.clone.style.top = (touch.clientY - offsetY) + 'px';
      
      // 查找目标位置
      var config = containerEl._dragSortConfig;
      var items = Array.from(containerEl.querySelectorAll(config.itemSelector));
      
      // 隐藏克隆元素以便获取下面的元素
      this.touchState.clone.style.display = 'none';
      var elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      this.touchState.clone.style.display = '';
      
      if (!elemBelow) return;
      
      var target = elemBelow.closest(config.itemSelector);
      if (!target || target === this.draggedItem || !containerEl.contains(target)) return;
      
      // 插入占位符
      var targetRect = target.getBoundingClientRect();
      var targetCenter = targetRect.top + targetRect.height / 2;
      
      if (touch.clientY < targetCenter) {
        containerEl.insertBefore(this.placeholder, target);
      } else {
        containerEl.insertBefore(this.placeholder, target.nextSibling);
      }
    },
    
    /**
     * 处理触摸拖拽结束
     */
    handleTouchDragEnd: function(containerEl) {
      if (!this.draggedItem || !this.placeholder) {
        this.cleanupTouchDrag();
        return;
      }
      
      var config = containerEl._dragSortConfig;
      
      // 将元素移动到占位符位置
      try {
        containerEl.insertBefore(this.draggedItem, this.placeholder);
      } catch (e) {
        console.error('[DragSort] 移动失败:', e);
      }
      
      // 保存排序
      var items = Array.from(containerEl.querySelectorAll(config.itemSelector));
      var newOrder = [];
      items.forEach(function(item) {
        var id = item.dataset.taskId || item.dataset.id || item.dataset.index || item.id;
        if (id) newOrder.push(id);
      });
      
      this.saveOrder(config.storageKey, newOrder);
      
      if (config.onReorder) {
        config.onReorder(newOrder);
      }
      
      this._dropCompleted = true;
      
      LifeGame.emit('sort:changed', {
        container: containerEl,
        storageKey: config.storageKey,
        order: newOrder
      });
      
      this.cleanupTouchDrag();
    },
    
    /**
     * 清理触摸拖拽状态
     */
    cleanupTouchDrag: function() {
      // 移除克隆元素
      if (this.touchState.clone) {
        this.touchState.clone.remove();
        this.touchState.clone = null;
      }
      
      // 移除占位符
      if (this.placeholder && this.placeholder.parentNode) {
        this.placeholder.parentNode.removeChild(this.placeholder);
      }
      this.placeholder = null;
      
      // 恢复原元素样式
      if (this.draggedItem) {
        this.draggedItem.style.opacity = '';
        this.draggedItem.classList.remove('dragging-source');
      }
      
      // 清理容器样式
      if (this.container) {
        this.container.classList.remove('is-dragging');
      }
      document.body.classList.remove('dragging-active');
      
      this.draggedItem = null;
      this.container = null;
      this._dropCompleted = false;
      this.touchState.isDragging = false;
    },
    
    /**
     * 设置拖拽事件（桌面端鼠标拖拽）
     */
    setupDragEvents: function(containerEl, itemSelector) {
      // 桌面端使用 HTML5 Drag and Drop API
      // 事件监听在 setupGlobalEvents 中通过事件委托统一处理
      // 这里只需要确保元素设置了 draggable 属性
      var items = containerEl.querySelectorAll(itemSelector);
      items.forEach(function(item) {
        item.draggable = true;
        item.style.cursor = 'grab';
      });
    },
    
    /**
     * 绑定全局事件（只绑定一次）
     */
    bindGlobalEventsOnce: function() {
      if (this._globalEventsBound) return;
      this._globalEventsBound = true;
      this.setupGlobalEvents();
    },
    
    /**
     * 设置全局拖拽事件（桌面端）
     */
    setupGlobalEvents: function() {
      var self = this;
      
      // 绑定桌面端拖拽事件（鼠标拖拽）
      // 同时支持触摸设备和桌面设备
      
      document.addEventListener('dragstart', function(e) {
        // 如果正在触摸拖拽中，忽略鼠标事件
        if (self.touchState.isDragging) {
          e.preventDefault();
          return;
        }
        
        var target = e.target;
        var containerEl = null;
        var config = null;
        var matchedItem = null;
        
        for (var i = 0; i < self.containers.length; i++) {
          var container = self.containers[i];
          if (!container._dragSortConfig) continue;
          
          var item = target.closest(container._dragSortConfig.itemSelector);
          if (item && container.contains(item)) {
            containerEl = container;
            config = container._dragSortConfig;
            matchedItem = item;
            break;
          }
        }
        
        if (!matchedItem || !containerEl) return;
        
        self.handleDragStart(e, matchedItem, containerEl, config.itemSelector);
      });
      
      document.addEventListener('dragover', function(e) {
        if (!self.draggedItem || !self.container) return;
        
        var config = self.container._dragSortConfig;
        if (!config) return;
        
        // 安全检查：确保 e.target 是有效的 DOM 元素
        if (!e.target || typeof e.target.closest !== 'function') return;
        
        var item = e.target.closest(config.itemSelector);
        if (!item || item === self.draggedItem) return;
        
        if (!self.container.contains(item)) return;
        
        e.preventDefault();
        self.handleDragOver(e, item, self.container);
      });
      
      document.addEventListener('drop', function(e) {
        if (!self.draggedItem || !self.container) return;
        e.preventDefault();
        self.handleDrop(self.container);
      });
      
      document.addEventListener('dragend', function(e) {
        if (!self.draggedItem) return;
        self.handleDragEnd(self.container);
      });
    },
    
    /**
     * 拖拽开始（桌面端）
     */
    handleDragStart: function(e, item, containerEl, itemSelector) {
      this.draggedItem = item;
      this.container = containerEl;
      this.itemSelector = itemSelector;
      this._dropCompleted = false;
      
      var items = Array.from(containerEl.querySelectorAll(itemSelector));
      this.startIndex = items.indexOf(item);
      
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'drag-placeholder';
      
      var rect = item.getBoundingClientRect();
      this.placeholder.style.height = rect.height + 'px';
      this.placeholder.style.width = rect.width + 'px';
      this.placeholder.style.marginBottom = '12px';
      this.placeholder.style.background = 'rgba(56, 189, 248, 0.1)';
      this.placeholder.style.border = '2px dashed rgba(56, 189, 248, 0.4)';
      this.placeholder.style.borderRadius = '12px';
      
      var computedStyle = window.getComputedStyle(item);
      this.placeholder.style.margin = computedStyle.margin;
      
      item.parentNode.insertBefore(this.placeholder, item);
      
      item.classList.add('dragging-source');
      item.style.cursor = 'grabbing';
      
      containerEl.classList.add('is-dragging');
      document.body.classList.add('dragging-active');
      
      e.dataTransfer.effectAllowed = 'move';
      // 禁用自定义拖拽图像，使用默认浏览器行为
      // try {
      //   var img = new Image();
      //   img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      //   e.dataTransfer.setDragImage(img, 0, 0);
      // } catch (err) {}
    },
    
    /**
     * 拖拽经过（桌面端）
     */
    handleDragOver: function(e, target, containerEl) {
      if (!this.draggedItem || !this.placeholder) return;
      if (target === this.draggedItem) return;
      
      var rect = target.getBoundingClientRect();
      var targetCenter = rect.top + rect.height / 2;
      
      if (e.clientY < targetCenter) {
        containerEl.insertBefore(this.placeholder, target);
      } else {
        containerEl.insertBefore(this.placeholder, target.nextSibling);
      }
    },
    
    /**
     * 放置（桌面端）
     */
    handleDrop: function(containerEl) {
      if (!this.draggedItem || !this.placeholder) return;
      
      var config = containerEl._dragSortConfig;
      if (!config) return;
      
      if (!this.placeholder.parentNode || this.placeholder.parentNode !== containerEl) {
        return;
      }
      
      try {
        containerEl.insertBefore(this.draggedItem, this.placeholder);
      } catch (e) {
        return;
      }
      
      try {
        if (this.placeholder.parentNode) {
          this.placeholder.parentNode.removeChild(this.placeholder);
        }
      } catch (e) {}
      this.placeholder = null;
      
      this._dropCompleted = true;
      
      var items = Array.from(containerEl.querySelectorAll(config.itemSelector));
      var newOrder = [];
      items.forEach(function(item) {
        var id = item.dataset.taskId || item.dataset.id || item.dataset.index || item.id;
        if (id) newOrder.push(id);
      });
      
      this.saveOrder(config.storageKey, newOrder);
      
      if (config.onReorder) {
        config.onReorder(newOrder);
      }
      
      LifeGame.emit('sort:changed', {
        container: containerEl,
        storageKey: config.storageKey,
        order: newOrder
      });
    },
    
    /**
     * 拖拽结束（桌面端）
     */
    handleDragEnd: function(containerEl) {
      if (this.draggedItem) {
        this.draggedItem.classList.remove('dragging-source');
        this.draggedItem.style.cursor = 'grab';
        this.draggedItem.style.opacity = '';
      }
      
      if (containerEl) {
        containerEl.classList.remove('is-dragging');
      }
      document.body.classList.remove('dragging-active');
      
      if (!this._dropCompleted && this.placeholder && this.placeholder.parentNode) {
        try {
          this.placeholder.parentNode.removeChild(this.placeholder);
        } catch (e) {}
      }
      
      this.draggedItem = null;
      this.placeholder = null;
      this.container = null;
      this.itemSelector = null;
      this.startIndex = -1;
      this._dropCompleted = false;
    },
    
    /**
     * 保存排序
     */
    saveOrder: function(key, order) {
      try {
        if (LifeGame.core && LifeGame.core.Storage) {
          LifeGame.core.Storage.set(key, order);
        } else {
          var storageData = JSON.parse(localStorage.getItem('lifegame_sort_orders') || '{}');
          storageData[key] = order;
          localStorage.setItem('lifegame_sort_orders', JSON.stringify(storageData));
        }
      } catch (e) {
        console.error('[DragSort] 保存排序失败:', e);
      }
    },
    
    /**
     * 获取保存的排序
     */
    getSavedOrder: function(key) {
      try {
        if (LifeGame.core && LifeGame.core.Storage) {
          return LifeGame.core.Storage.get(key);
        }
        var storageData = JSON.parse(localStorage.getItem('lifegame_sort_orders') || '{}');
        return storageData[key] || null;
      } catch (e) {
        return null;
      }
    },
    
    /**
     * 应用排序到数据
     */
    applyOrder: function(dataArray, orderKey, idField) {
      var savedOrder = this.getSavedOrder(orderKey);
      if (!savedOrder || savedOrder.length === 0) return dataArray;
      
      idField = idField || 'id';
      var orderedData = [];
      var remainingData = dataArray.slice();
      
      savedOrder.forEach(function(orderId) {
        var index = remainingData.findIndex(function(item) {
          return item[idField] === orderId;
        });
        if (index !== -1) {
          orderedData.push(remainingData[index]);
          remainingData.splice(index, 1);
        }
      });
      
      return orderedData.concat(remainingData);
    },
    
    /**
     * 刷新拖拽状态
     */
    refresh: function(container, itemSelector) {
      var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      if (!containerEl) return;
      
      var items = containerEl.querySelectorAll(itemSelector);
      items.forEach(function(item) {
        // 同时支持鼠标和触摸
        item.draggable = true;
        item.style.cursor = 'grab';
      });
    },
    
    /**
     * 清除容器列表
     */
    clearContainers: function() {
      this.containers = [];
      this._globalEventsBound = false;
    }
  };
  
  window.DragSort = DragSort;
  if (typeof LifeGame !== 'undefined') {
    LifeGame.DragSort = DragSort;
  }
})();
