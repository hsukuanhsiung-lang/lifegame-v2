/**
 * Drag Sort Module v2 - 重写版本，更简洁可靠
 */
(function() {
  'use strict';
  
  // 模块状态
  var state = {
    draggedItem: null,
    placeholder: null,
    container: null,
    config: null,
    isInitialized: false
  };
  
  // 初始化函数
  function initDragSort(container, itemSelector, storageKey, onReorder) {
    LifeGame.log('[DragSortV2] 初始化开始:', { container: !!container, itemSelector, storageKey });
    
    if (!container) {
      console.error('[DragSortV2] 容器为空');
      return;
    }
    
    // 存储配置
    container._dragSortConfig = {
      itemSelector: itemSelector,
      storageKey: storageKey,
      onReorder: onReorder
    };
    
    // 设置卡片可拖拽
    var items = container.querySelectorAll(itemSelector);
    LifeGame.log('[DragSortV2] 找到', items.length, '个元素');
    
    items.forEach(function(item) {
      item.draggable = true;
      item.style.cursor = 'grab';
      item.style.userSelect = 'none';
    });
    
    // 绑定事件（如果还没绑定）
    if (!state.isInitialized) {
      bindEvents();
      state.isInitialized = true;
    }
    
    LifeGame.log('[DragSortV2] 初始化完成');
  }
  
  // 绑定全局事件
  function bindEvents() {
    LifeGame.log('[DragSortV2] 绑定全局事件');
    
    document.addEventListener('dragstart', function(e) {
      var target = e.target;
      
      // 查找包含此元素的容器
      var container = findContainer(target);
      if (!container) return;
      
      var config = container._dragSortConfig;
      if (!config) return;
      
      // 确认目标匹配选择器
      var item = target.closest(config.itemSelector);
      if (!item || !container.contains(item)) return;
      
      LifeGame.log('[DragSortV2] dragstart:', item.dataset.id || item.textContent);
      
      state.draggedItem = item;
      state.container = container;
      state.config = config;
      
      // 创建占位符
      state.placeholder = document.createElement('div');
      state.placeholder.className = 'drag-placeholder';
      state.placeholder.style.cssText = 'background:rgba(56,189,248,0.2);border:2px dashed rgba(56,189,248,0.6);border-radius:8px;height:' + item.offsetHeight + 'px;';
      
      item.parentNode.insertBefore(state.placeholder, item);
      item.classList.add('dragging-source');
      item.style.opacity = '0.3';
      
      e.dataTransfer.effectAllowed = 'move';
    });
    
    document.addEventListener('dragover', function(e) {
      if (!state.draggedItem || !state.container) return;
      
      e.preventDefault();
      
      var target = e.target.closest(state.config.itemSelector);
      if (!target || target === state.draggedItem) return;
      
      var rect = target.getBoundingClientRect();
      var midpoint = rect.top + rect.height / 2;
      
      if (e.clientY < midpoint) {
        state.container.insertBefore(state.placeholder, target);
      } else {
        state.container.insertBefore(state.placeholder, target.nextSibling);
      }
    });
    
    document.addEventListener('drop', function(e) {
      if (!state.draggedItem || !state.container) return;
      e.preventDefault();
      
      LifeGame.log('[DragSortV2] drop');
      
      // 移动元素
      state.container.insertBefore(state.draggedItem, state.placeholder);
      
      // 获取新排序
      var items = Array.from(state.container.querySelectorAll(state.config.itemSelector));
      var newOrder = items.map(function(item) {
        return item.dataset.id || item.dataset.taskId || item.id;
      }).filter(Boolean);
      
      // 保存
      if (state.config.onReorder) {
        state.config.onReorder(newOrder);
      }
      
      // 存储到 localStorage
      try {
        localStorage.setItem(state.config.storageKey, JSON.stringify(newOrder));
      } catch(e) {}
      
      LifeGame.log('[DragSortV2] 新排序:', newOrder);
    });
    
    document.addEventListener('dragend', function(e) {
      if (!state.draggedItem) return;
      
      LifeGame.log('[DragSortV2] dragend');
      
      // 清理
      if (state.placeholder && state.placeholder.parentNode) {
        state.placeholder.parentNode.removeChild(state.placeholder);
      }
      
      state.draggedItem.classList.remove('dragging-source');
      state.draggedItem.style.opacity = '';
      
      state.draggedItem = null;
      state.placeholder = null;
      state.container = null;
      state.config = null;
    });
  }
  
  // 查找容器
  function findContainer(element) {
    var parent = element;
    while (parent) {
      if (parent._dragSortConfig) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
  
  // 暴露到全局
  window.DragSortV2 = {
    init: initDragSort
  };
  
  LifeGame.log('[DragSortV2] 模块已加载');
})();
