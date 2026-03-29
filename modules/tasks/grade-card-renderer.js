/**
 * 任务等级卡片渲染器
 * 9级颜色系统：F/E/D/C/B/A/S/SS/SSS
 */

(function() {
  'use strict';
  
  // 等级配置映射
  var GRADE_CONFIG = {
    'F': { title: '初心', exp: 1, color: '#6b6b6b' },
    'E': { title: '学徒', exp: 5, color: '#cd7f32' },
    'D': { title: '熟练', exp: 10, color: '#3b82f6' },
    'C': { title: '进阶', exp: 100, color: '#22c55e' },
    'B': { title: '专家', exp: 1000, color: '#a855f7' },
    'A': { title: '大师', exp: 10000, color: '#f59e0b' },
    'S': { title: '史诗', exp: 100000, color: '#ef4444' },
    'SS': { title: '传说', exp: 1000000, color: 'linear-gradient(90deg, #ef4444, #a855f7)' },
    'SSS': { title: '神话', exp: 10000000, color: 'linear-gradient(90deg, #ef4444, #3b82f6, #facc15)' }
  };
  
  // 等级顺序（用于升级计算）
  var GRADE_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  
  window.TaskGradeCardRenderer = {
    /**
     * 渲染任务卡片
     * @param {Object} task - 任务数据对象
     * @param {Object} options - 可选配置
     * @returns {string} HTML字符串
     */
    render: function(task, options) {
      options = options || {};
      
      // 获取等级（优先使用grade字段，否则从diff映射）
      var grade = task.grade || task.diff || 'F';
      grade = grade.toUpperCase();
      
      var config = GRADE_CONFIG[grade] || GRADE_CONFIG['F'];
      var gradeClass = 'grade-' + grade.toLowerCase();
      
      // 计算进度
      var progress = task.progress || 0;
      var currentExp = task.currentExp || 0;
      var targetExp = config.exp;
      var progressPercent = Math.min(100, (currentExp / targetExp) * 100);
      
      // 图标（默认或自定义）
      var icon = task.icon || this.getDefaultIcon(grade);
      
      // 描述文字
      var desc = task.desc || task.sub || '完成任务获取EXP';
      
      // SSS级脉冲环
      var sssPulseRings = grade === 'SSS' ? 
        '<div class="sss-pulse-ring"></div><div class="sss-pulse-ring"></div><div class="sss-pulse-ring"></div>' : '';
      
      // 构建卡片HTML
      var html = 
        '<div class="task-grade-card ' + gradeClass + '" data-task-id="' + (task.id || '') + '" data-grade="' + grade + '">' +
          sssPulseRings +
          (grade === 'SSS' ? '<div class="card-shimmer"></div>' : '') +
          
          // 等级徽章
          '<div class="task-grade-badge">' + grade + '</div>' +
          
          // 图标
          '<div class="task-grade-icon">' + icon + '</div>' +
          
          // 标题
          '<div class="task-grade-title">' + (task.n || task.name || '未命名任务') + '</div>' +
          
          // 描述
          '<div class="task-grade-desc">' + desc + '</div>' +
          
          // 进度条
          '<div class="task-grade-progress">' +
            '<div class="task-grade-progress-fill" style="width:' + progressPercent + '%"></div>' +
          '</div>' +
          
          // 底部信息
          '<div class="task-grade-footer">' +
            '<span class="task-grade-exp">EXP: ' + currentExp + '/' + targetExp + '</span>' +
            '<span class="task-grade-title-name">' + config.title + '</span>' +
          '</div>' +
        '</div>';
      
      return html;
    },
    
    /**
     * 获取默认图标
     */
    getDefaultIcon: function(grade) {
      var icons = {
        'F': '🌱',
        'E': '🥉',
        'D': '💠',
        'C': '🌿',
        'B': '💎',
        'A': '👑',
        'S': '🔥',
        'SS': '⚡',
        'SSS': '🌟'
      };
      return icons[grade] || '📋';
    },
    
    /**
     * 获取等级配置
     */
    getGradeConfig: function(grade) {
      return GRADE_CONFIG[(grade || 'F').toUpperCase()] || GRADE_CONFIG['F'];
    },
    
    /**
     * 获取下一等级
     */
    getNextGrade: function(currentGrade) {
      var index = GRADE_ORDER.indexOf((currentGrade || 'F').toUpperCase());
      if (index >= 0 && index < GRADE_ORDER.length - 1) {
        return GRADE_ORDER[index + 1];
      }
      return null;
    },
    
    /**
     * 计算升级所需EXP
     */
    getExpForNextGrade: function(currentGrade) {
      var current = this.getGradeConfig(currentGrade);
      var next = this.getNextGrade(currentGrade);
      if (next) {
        var nextConfig = this.getGradeConfig(next);
        return nextConfig.exp - current.exp;
      }
      return 0;
    },
    
    /**
     * 检查是否可以升级
     */
    canUpgrade: function(task) {
      var grade = (task.grade || task.diff || 'F').toUpperCase();
      var currentExp = task.currentExp || 0;
      var config = this.getGradeConfig(grade);
      return currentExp >= config.exp;
    },
    
    /**
     * 执行升级
     */
    upgrade: function(task) {
      var currentGrade = (task.grade || task.diff || 'F').toUpperCase();
      var nextGrade = this.getNextGrade(currentGrade);
      
      if (nextGrade) {
        task.grade = nextGrade;
        task.diff = nextGrade; // 保持兼容
        // 经验值保留，继续累计
        return {
          success: true,
          oldGrade: currentGrade,
          newGrade: nextGrade,
          task: task
        };
      }
      
      return { success: false, reason: '已达到最高等级' };
    },
    
    /**
     * 添加EXP
     */
    addExp: function(task, exp) {
      task.currentExp = (task.currentExp || 0) + exp;
      
      // 检查是否满足升级条件
      var canUpgrade = this.canUpgrade(task);
      
      return {
        task: task,
        addedExp: exp,
        totalExp: task.currentExp,
        canUpgrade: canUpgrade
      };
    }
  };
  
})();
