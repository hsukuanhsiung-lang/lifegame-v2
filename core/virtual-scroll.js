/**
 * Virtual Scroll - 虚拟滚动系统
 * 只渲染可见区域的元素，提升大量数据的渲染性能
 */

(function() {
  'use strict';
  
  var VirtualScroll = {
    // 容器元素
    container: null,
    
    // 内容包装器
    contentWrapper: null,
    
    // 数据数组
    data: [],
    
    // 渲染函数
    renderFn: null,
    
    // 每项高度（预估）
    itemHeight: 80,
    
    // 缓冲区大小（上下各多渲染几项）
    bufferSize: 3,
    
    // 当前渲染范围
    startIndex: 0,
    endIndex: 0,
    
    // 总高度
    totalHeight: 0,
    
    // 滚动处理器
    scrollHandler: null,
    
    // 是否已初始化
    initialized: false,
    
    /**
     * 初始化虚拟滚动
     * @param {Object} options - 配置选项
     * @param {HTMLElement} options.container - 容器元素
     * @param {Array} options.data - 数据数组
     * @param {Function} options.renderFn - 渲染函数，接收item返回HTML字符串
     * @param {number} options.itemHeight - 每项预估高度（默认80）
     * @param {number} options.bufferSize - 缓冲区大小（默认3）
     */
    init: function(options) {
      this.container = options.container;
      this.data = options.data || [];
      this.renderFn = options.renderFn;
      this.itemHeight = options.itemHeight || 80;
      this.bufferSize = options.bufferSize || 3;
      
      if (!this.container) {
        console.error('[VirtualScroll] 需要提供容器元素');
        return;
      }
      
      this._setupContainer();
      this._createContentWrapper();
      this._bindScroll();
      this._calculateTotalHeight();
      this._render();
      
      this.initialized = true;
      LifeGame.log('[VirtualScroll] 初始化完成，数据数:', this.data.length);
    },
    
    /**
     * 设置容器样式
     */
    _setupContainer: function() {
      var container = this.container;
      container.style.overflow = 'auto';
      container.style.position = 'relative';
      
      // 确保容器有高度
      if (!container.style.height && !container.style.maxHeight) {
        container.style.maxHeight = '600px';
      }
    },
    
    /**
     * 创建内容包装器
     */
    _createContentWrapper: function() {
      // 检查是否已存在
      var existing = this.container.querySelector('.virtual-scroll-content');
      if (existing) {
        existing.remove();
      }
      
      var wrapper = document.createElement('div');
      wrapper.className = 'virtual-scroll-content';
      wrapper.style.cssText = 
        'position:relative;' +
        'width:100%;';
      
      this.container.innerHTML = '';
      this.container.appendChild(wrapper);
      this.contentWrapper = wrapper;
    },
    
    /**
     * 绑定滚动事件
     */
    _bindScroll: function() {
      var self = this;
      
      this.scrollHandler = function() {
        self._onScroll();
      };
      
      this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
    },
    
    /**
     * 计算总高度
     */
    _calculateTotalHeight: function() {
      this.totalHeight = this.data.length * this.itemHeight;
      this.contentWrapper.style.height = this.totalHeight + 'px';
    },
    
    /**
     * 滚动处理
     */
    _onScroll: function() {
      if (!this.initialized) return;
      
      requestAnimationFrame(function() {
        this._render();
      }.bind(this));
    },
    
    /**
     * 渲染可见区域
     */
    _render: function() {
      var containerHeight = this.container.clientHeight;
      var scrollTop = this.container.scrollTop;
      
      // 计算可见范围
      var visibleStart = Math.floor(scrollTop / this.itemHeight);
      var visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
      
      // 加上缓冲区
      var start = Math.max(0, visibleStart - this.bufferSize);
      var end = Math.min(this.data.length, visibleEnd + this.bufferSize);
      
      // 如果范围没变，不重新渲染
      if (start === this.startIndex && end === this.endIndex) {
        return;
      }
      
      this.startIndex = start;
      this.endIndex = end;
      
      // 生成HTML
      var html = '';
      for (var i = start; i < end; i++) {
        var item = this.data[i];
        var itemHtml = this.renderFn(item, i);
        var top = i * this.itemHeight;
        
        html += '<div class="virtual-scroll-item" style="' +
          'position:absolute;' +
          'top:' + top + 'px;' +
          'left:0;' +
          'right:0;' +
          'height:' + this.itemHeight + 'px;' +
          '">' + itemHtml + '</div>';
      }
      
      this.contentWrapper.innerHTML = html;
    },
    
    /**
     * 更新数据
     * @param {Array} newData - 新的数据数组
     */
    updateData: function(newData) {
      this.data = newData || [];
      this._calculateTotalHeight();
      this._render();
    },
    
    /**
     * 滚动到指定索引
     * @param {number} index - 目标索引
     * @param {string} behavior - 滚动行为 ('auto' | 'smooth')
     */
    scrollToIndex: function(index, behavior) {
      behavior = behavior || 'auto';
      var scrollTop = index * this.itemHeight;
      this.container.scrollTo({
        top: scrollTop,
        behavior: behavior
      });
    },
    
    /**
     * 滚动到顶部
     */
    scrollToTop: function() {
      this.container.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    /**
     * 滚动到底部
     */
    scrollToBottom: function() {
      var scrollTop = this.totalHeight - this.container.clientHeight;
      this.container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    },
    
    /**
     * 销毁虚拟滚动
     */
    destroy: function() {
      if (this.scrollHandler) {
        this.container.removeEventListener('scroll', this.scrollHandler);
      }
      
      this.initialized = false;
      this.container = null;
      this.contentWrapper = null;
      this.data = [];
      this.renderFn = null;
    }
  };
  
  // 暴露到全局
  window.VirtualScroll = VirtualScroll;
  
})();
