/**
 * DragSort Simple - 最简可靠版本
 * 直接在卡片上绑定事件，不使用事件委托
 */
(function() {
  'use strict';
  
  var DragSortSimple = {
    
    init: function(container, itemSelector, storageKey, onReorder) {
      var self = this;
      var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
      
      if (!containerEl) {
        console.error('[DragSortSimple] 容器未找到');
        return;
      }
      
      LifeGame.log('[DragSortSimple] 初始化:', itemSelector, storageKey);
      
      var items = containerEl.querySelectorAll(itemSelector);
      LifeGame.log('[DragSortSimple] 找到', items.length, '个元素');
      
      // 为每个元素单独绑定事件
      items.forEach(function(item) {
        item.draggable = true;
        item.style.cursor = 'grab';
        item.style.userSelect = 'none';
        
        // 拖拽开始
        item.ondragstart = function(e) {
          LifeGame.log('[DragSortSimple] 开始拖拽:', item.dataset.taskId || item.textContent);
          
          self.draggedItem = item;
          self.container = containerEl;
          self.itemSelector = itemSelector;
          self.onReorder = onReorder;
          self.storageKey = storageKey;
          
          // 创建占位符
          self.placeholder = document.createElement('div');
          self.placeholder.className = 'drag-placeholder-simple';
          var h = item.offsetHeight;
          self.placeholder.style.cssText = 
            'background:linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.3) 100%) !important;' +
            'border:3px dashed #3b82f6 !important;' +
            'border-radius:12px !important;' +
            'height:' + h + 'px !important;' +
            'margin-bottom:12px !important;' +
            'box-shadow:0 0 20px rgba(59,130,246,0.5) !important;' +
            'animation:drag-pulse 0.8s ease-in-out infinite !important;';
          
          item.parentNode.insertBefore(self.placeholder, item);
          item.classList.add('dragging-source');
          item.style.opacity = '0.3';
          
          e.dataTransfer.effectAllowed = 'move';
        };
        
        // 拖拽结束（drop成功后也会触发）
        item.ondragend = function(e) {
          LifeGame.log('[DragSortSimple] 拖拽结束');
          
          // 如果已经通过 drop 处理过了（占位符已被移除），则不再处理
          if (self._dropped) {
            self._dropped = false;
            // 只清理样式
            if (self.draggedItem) {
              self.draggedItem.classList.remove('dragging-source');
              self.draggedItem.style.opacity = '';
            }
            self.draggedItem = null;
            self.placeholder = null;
            self.container = null;
            return;
          }
          
          // 如果有占位符，说明 drop 没触发（拖到容器外），恢复原位
          if (self.placeholder && self.placeholder.parentNode) {
            self.placeholder.parentNode.insertBefore(self.draggedItem, self.placeholder);
            self.placeholder.parentNode.removeChild(self.placeholder);
          }
          
          // 清理样式
          if (self.draggedItem) {
            self.draggedItem.classList.remove('dragging-source');
            self.draggedItem.style.opacity = '';
          }
          
          self.draggedItem = null;
          self.placeholder = null;
          self.container = null;
        };
      });
      
      // 容器上的 dragover 和 drop
      containerEl.ondragover = function(e) {
        if (!self.draggedItem) return;
        e.preventDefault();
        
        // 找到鼠标下方的元素
        var target = e.target.closest(itemSelector);
        if (!target || target === self.draggedItem) return;
        
        var rect = target.getBoundingClientRect();
        var midpoint = rect.top + rect.height / 2;
        
        // 插入占位符
        if (e.clientY < midpoint) {
          containerEl.insertBefore(self.placeholder, target);
        } else {
          containerEl.insertBefore(self.placeholder, target.nextSibling);
        }
      };
      
      containerEl.ondrop = function(e) {
        if (!self.draggedItem) return;
        e.preventDefault();
        
        LifeGame.log('[DragSortSimple] 放置');
        
        // 标记已放置，这样 dragend 不会重复处理
        self._dropped = true;
        
        // 移动元素到占位符位置
        containerEl.insertBefore(self.draggedItem, self.placeholder);
        
        // 移除占位符
        if (self.placeholder && self.placeholder.parentNode) {
          self.placeholder.parentNode.removeChild(self.placeholder);
        }
        
        // 获取新排序
        var items = Array.from(containerEl.querySelectorAll(itemSelector));
        var newOrder = items.map(function(i) {
          return i.dataset.taskId || i.dataset.id || i.id;
        }).filter(Boolean);
        
        LifeGame.log('[DragSortSimple] 新排序:', newOrder);
        
        // 添加视觉反馈
        self.draggedItem.style.transition = 'transform 0.2s, box-shadow 0.2s';
        self.draggedItem.style.transform = 'scale(1.02)';
        self.draggedItem.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        setTimeout(function() {
          if (self.draggedItem) {
            self.draggedItem.style.transform = '';
            self.draggedItem.style.boxShadow = '';
          }
        }, 300);
        
        // 回调
        if (onReorder) {
          onReorder(newOrder);
        }
        
        // 保存到 storage
        try {
          if (window.LifeGame && LifeGame.core && LifeGame.core.Storage) {
            LifeGame.core.Storage.set(storageKey, newOrder);
          } else {
            localStorage.setItem(storageKey, JSON.stringify(newOrder));
          }
        } catch(e) {
          console.error('[DragSortSimple] 保存失败:', e);
        }
        
        // 清理
        self.draggedItem.classList.remove('dragging-source');
        self.draggedItem.style.opacity = '';
        self.draggedItem = null;
        self.placeholder = null;
      };
      
      LifeGame.log('[DragSortSimple] 初始化完成');
    }
  };
  
  window.DragSortSimple = DragSortSimple;
})();
