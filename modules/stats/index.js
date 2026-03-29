/**
 * Stats Module - 统计页面图表
 * 显示经验曲线、属性雷达图、历史完成率等统计图表
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'stats';
  
  // 6属性配置
  var ATTRIBUTES = {
    hp: { name: '生命', color: '#ef4444', icon: '❤️' },
    str: { name: '力量', color: '#f97316', icon: '💪' },
    int: { name: '智力', color: '#3b82f6', icon: '🧠' },
    agi: { name: '敏捷', color: '#22c55e', icon: '⚡' },
    free: { name: '自由', color: '#a855f7', icon: '🦋' },
    rest: { name: '休息', color: '#64748b', icon: '☕' }
  };
  
  var StatsModule = {
    init: function() {
      LifeGame.log('[stats] 初始化');
      this.bindEvents();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:stats', function(data) {
        var module = LifeGame.getModule('stats');
        if (module) module.render();
      });
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('world-content');
      }
      if (!container) {
        console.error('[stats] render 失败: 找不到容器');
        return;
      }
      
      this._lastContainer = container;
      
      var html = 
        '<div class="stats-container">' +
          // 页面头部
          '<div class="page-header">' +
            '<button class="page-back-btn" id="back-btn">←</button>' +
            '<h2 class="page-title">📊 数据统计</h2>' +
          '</div>' +
          
          // 统计概览卡片
          '<div class="stats-summary-grid">' +
            this.renderSummaryCards() +
          '</div>' +
          
          // 经验曲线图
          '<div class="stats-section">' +
            '<div class="stats-section-title">' +
              '<span class="section-icon">📈</span>' +
              '<span>经验获取趋势（近30天）</span>' +
            '</div>' +
            '<div class="stats-chart-container">' +
              '<canvas id="exp-chart" width="700" height="200"></canvas>' +
            '</div>' +
          '</div>' +
          
          // 属性雷达图
          '<div class="stats-section">' +
            '<div class="stats-section-title">' +
              '<span class="section-icon">🎯</span>' +
              '<span>六维属性分布</span>' +
            '</div>' +
            '<div class="stats-radar-container">' +
              '<canvas id="radar-chart" width="300" height="300"></canvas>' +
              '<div class="radar-legend">' + this.renderRadarLegend() + '</div>' +
            '</div>' +
          '</div>' +
          
          // 完成率图表
          '<div class="stats-section">' +
            '<div class="stats-section-title">' +
              '<span class="section-icon">✅</span>' +
              '<span>近7天完成率</span>' +
            '</div>' +
            '<div class="stats-chart-container">' +
              '<canvas id="completion-chart" width="700" height="180"></canvas>' +
            '</div>' +
          '</div>' +
          
          // 任务分布饼图
          '<div class="stats-section stats-section-half">' +
            '<div class="stats-section-title">' +
              '<span class="section-icon">🥧</span>' +
              '<span>任务类型分布</span>' +
            '</div>' +
            '<div class="stats-pie-container">' +
              '<canvas id="task-pie-chart" width="250" height="250"></canvas>' +
              '<div class="pie-legend" id="pie-legend"></div>' +
            '</div>' +
          '</div>' +
          
        '</div>';
      
      container.innerHTML = html;
      
      // 绑定返回按钮
      var backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          LifeGame.emit('nav:back');
        });
      }
      
      // 绘制图表
      this.drawExpChart();
      this.drawRadarChart();
      this.drawCompletionChart();
      this.drawTaskPieChart();
    },
    
    // 渲染概览卡片
    renderSummaryCards: function() {
      var stats = this.calculateStats();
      
      var cards = [
        { icon: '⭐', label: '总经验值', value: stats.totalExp.toLocaleString(), color: '#fbbf24' },
        { icon: '📋', label: '累计任务', value: stats.totalTasks.toLocaleString(), color: '#38bdf8' },
        { icon: '🔥', label: '挑战完成', value: stats.totalChallenges.toLocaleString(), color: '#f97316' },
        { icon: '📅', label: '活跃天数', value: stats.activeDays + '天', color: '#22c55e' }
      ];
      
      return cards.map(function(card) {
        return '<div class="stats-summary-card" style="--card-color: ' + card.color + '">' +
          '<div class="summary-icon">' + card.icon + '</div>' +
          '<div class="summary-value">' + card.value + '</div>' +
          '<div class="summary-label">' + card.label + '</div>' +
        '</div>';
      }).join('');
    },
    
    // 计算统计数据
    calculateStats: function() {
      var storage = LifeGame.core.Storage.data;
      var history = storage.history || [];
      var tasks = storage.tasks || [];
      
      // 总经验值
      var totalExp = 0;
      var expRecords = history.filter(function(h) { 
        return h.type === 'EXP_GAIN' || h.type === 'CHALLENGE_COMPLETE'; 
      });
      expRecords.forEach(function(r) {
        var data = r.data || {};
        totalExp += data.exp || data.amount || 0;
      });
      
      // 累计任务
      var totalTasks = tasks.length;
      
      // 挑战完成次数
      var totalChallenges = history.filter(function(h) { 
        return h.type === 'CHALLENGE_COMPLETE'; 
      }).length;
      
      // 活跃天数（有记录的日期数）
      var dates = new Set();
      history.forEach(function(h) { dates.add(h.date); });
      var activeDays = dates.size;
      
      return {
        totalExp: totalExp,
        totalTasks: totalTasks,
        totalChallenges: totalChallenges,
        activeDays: activeDays
      };
    },
    
    // 渲染雷达图图例
    renderRadarLegend: function() {
      var html = '';
      for (var key in ATTRIBUTES) {
        var attr = ATTRIBUTES[key];
        html += '<div class="radar-legend-item">' +
          '<span class="legend-color" style="background: ' + attr.color + '"></span>' +
          '<span class="legend-icon">' + attr.icon + '</span>' +
          '<span class="legend-name">' + attr.name + '</span>' +
        '</div>';
      }
      return html;
    },
    
    // 绘制经验曲线图
    drawExpChart: function() {
      var canvas = document.getElementById('exp-chart');
      if (!canvas) return;
      
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      
      // 设置高DPI
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      var width = rect.width;
      var height = rect.height;
      var padding = { top: 20, right: 20, bottom: 30, left: 50 };
      
      // 获取近30天的经验数据
      var data = this.getExpData(30);
      
      if (data.length === 0) {
        this.drawEmptyChart(ctx, width, height, '暂无经验数据');
        return;
      }
      
      var maxExp = Math.max.apply(null, data.map(function(d) { return d.value; })) || 1;
      maxExp = Math.ceil(maxExp * 1.1); // 留10%余量
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制网格线
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (var i = 0; i <= 5; i++) {
        var y = padding.top + (height - padding.top - padding.bottom) * i / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y轴标签
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        var label = Math.round(maxExp * (5 - i) / 5);
        ctx.fillText(label, padding.left - 8, y + 3);
      }
      
      // 绘制曲线
      var chartWidth = width - padding.left - padding.right;
      var chartHeight = height - padding.top - padding.bottom;
      
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      
      data.forEach(function(d, i) {
        var x = padding.left + (chartWidth * i / (data.length - 1 || 1));
        var y = padding.top + chartHeight - (d.value / maxExp * chartHeight);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // 使用贝塞尔曲线使线条平滑
          var prevX = padding.left + (chartWidth * (i - 1) / (data.length - 1 || 1));
          var prevY = padding.top + chartHeight - (data[i - 1].value / maxExp * chartHeight);
          var cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      });
      ctx.stroke();
      
      // 绘制渐变填充
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      data.forEach(function(d, i) {
        var x = padding.left + (chartWidth * i / (data.length - 1 || 1));
        var y = padding.top + chartHeight - (d.value / maxExp * chartHeight);
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          var prevX = padding.left + (chartWidth * (i - 1) / (data.length - 1 || 1));
          var prevY = padding.top + chartHeight - (data[i - 1].value / maxExp * chartHeight);
          var cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      });
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.closePath();
      
      var gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 绘制数据点
      data.forEach(function(d, i) {
        var x = padding.left + (chartWidth * i / (data.length - 1 || 1));
        var y = padding.top + chartHeight - (d.value / maxExp * chartHeight);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      // X轴标签（显示5个日期）
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      var step = Math.ceil(data.length / 5);
      for (var i = 0; i < data.length; i += step) {
        var x = padding.left + (chartWidth * i / (data.length - 1 || 1));
        var dateStr = data[i].date.substr(5); // 显示 MM-DD
        ctx.fillText(dateStr, x, height - 10);
      }
    },
    
    // 获取经验数据
    getExpData: function(days) {
      var history = LifeGame.core.Storage.get('history') || [];
      var result = [];
      var today = new Date();
      
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        // 计算该日期的经验值
        var exp = 0;
        history.filter(function(h) { return h.date === dateStr; }).forEach(function(h) {
          if (h.type === 'EXP_GAIN' || h.type === 'CHALLENGE_COMPLETE') {
            exp += (h.data && (h.data.exp || h.data.amount)) || 0;
          }
        });
        
        result.push({ date: dateStr, value: exp });
      }
      
      return result;
    },
    
    // 绘制雷达图
    drawRadarChart: function() {
      var canvas = document.getElementById('radar-chart');
      if (!canvas) return;
      
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      var width = rect.width;
      var height = rect.height;
      var centerX = width / 2;
      var centerY = height / 2;
      var radius = Math.min(width, height) / 2 - 40;
      
      var attrKeys = Object.keys(ATTRIBUTES);
      var attrData = this.getAttributeData();
      var maxValue = 100; // 最大属性值
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制背景网格（5个同心多边形）
      for (var i = 1; i <= 5; i++) {
        ctx.beginPath();
        var r = radius * i / 5;
        for (var j = 0; j < attrKeys.length; j++) {
          var angle = (Math.PI * 2 * j / attrKeys.length) - Math.PI / 2;
          var x = centerX + r * Math.cos(angle);
          var y = centerY + r * Math.sin(angle);
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 绘制轴线
      for (var i = 0; i < attrKeys.length; i++) {
        var angle = (Math.PI * 2 * i / attrKeys.length) - Math.PI / 2;
        var x = centerX + radius * Math.cos(angle);
        var y = centerY + radius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
        
        // 绘制属性标签
        var labelX = centerX + (radius + 20) * Math.cos(angle);
        var labelY = centerY + (radius + 20) * Math.sin(angle);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ATTRIBUTES[attrKeys[i]].name, labelX, labelY);
      }
      
      // 绘制数据区域
      ctx.beginPath();
      for (var i = 0; i < attrKeys.length; i++) {
        var angle = (Math.PI * 2 * i / attrKeys.length) - Math.PI / 2;
        var value = attrData[attrKeys[i]] || 0;
        var r = radius * value / maxValue;
        var x = centerX + r * Math.cos(angle);
        var y = centerY + r * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // 填充渐变
      var gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制数据点
      for (var i = 0; i < attrKeys.length; i++) {
        var angle = (Math.PI * 2 * i / attrKeys.length) - Math.PI / 2;
        var value = attrData[attrKeys[i]] || 0;
        var r = radius * value / maxValue;
        var x = centerX + r * Math.cos(angle);
        var y = centerY + r * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = ATTRIBUTES[attrKeys[i]].color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 显示数值
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var valueX = centerX + (r + 15) * Math.cos(angle);
        var valueY = centerY + (r + 15) * Math.sin(angle);
        ctx.fillText(Math.round(value), valueX, valueY);
      }
    },
    
    // 获取属性数据
    getAttributeData: function() {
      // 从时间轨迹数据中计算各属性时长
      var timelineData = LifeGame.core.Storage.get('timelineData') || {};
      var attrHours = { hp: 0, str: 0, int: 0, agi: 0, free: 0, rest: 0 };
      
      Object.values(timelineData).forEach(function(day) {
        var slots = day.slots || {};
        Object.values(slots).forEach(function(slot) {
          if (slot.attr && attrHours[slot.attr] !== undefined) {
            attrHours[slot.attr] += 0.25; // 每个格子15分钟 = 0.25小时
          }
        });
      });
      
      // 转换为0-100的值（假设最大100小时）
      var result = {};
      for (var key in attrHours) {
        result[key] = Math.min(100, attrHours[key]);
      }
      
      return result;
    },
    
    // 绘制完成率图表
    drawCompletionChart: function() {
      var canvas = document.getElementById('completion-chart');
      if (!canvas) return;
      
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      var width = rect.width;
      var height = rect.height;
      var padding = { top: 20, right: 20, bottom: 40, left: 50 };
      
      var data = this.getCompletionData(7);
      
      if (data.length === 0) {
        this.drawEmptyChart(ctx, width, height, '暂无完成数据');
        return;
      }
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      var chartWidth = width - padding.left - padding.right;
      var chartHeight = height - padding.top - padding.bottom;
      var barWidth = chartWidth / data.length * 0.6;
      var barSpacing = chartWidth / data.length * 0.4;
      
      // 绘制Y轴网格和标签
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      for (var i = 0; i <= 5; i++) {
        var y = padding.top + chartHeight * i / 5;
        var percentage = (5 - i) * 20;
        ctx.fillText(percentage + '%', padding.left - 8, y + 3);
        
        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      
      // 绘制柱状图
      data.forEach(function(d, i) {
        var x = padding.left + (chartWidth / data.length) * i + barSpacing / 2;
        var barHeight = chartHeight * d.rate / 100;
        var y = padding.top + chartHeight - barHeight;
        
        // 任务完成率柱子（蓝色）
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, y, barWidth / 2, barHeight);
        
        // 挑战完成率柱子（橙色）
        var challengeHeight = chartHeight * d.challengeRate / 100;
        var challengeY = padding.top + chartHeight - challengeHeight;
        ctx.fillStyle = '#f97316';
        ctx.fillRect(x + barWidth / 2, challengeY, barWidth / 2, challengeHeight);
        
        // 日期标签
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        var dayStr = d.date.substr(5); // MM-DD
        ctx.fillText(dayStr, x + barWidth / 2, height - 20);
        
        // 星期标签
        var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        var date = new Date(d.date);
        var weekDay = weekDays[date.getDay()];
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px sans-serif';
        ctx.fillText(weekDay, x + barWidth / 2, height - 8);
      });
      
      // 绘制图例
      var legendY = padding.top - 5;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(width - 120, legendY, 12, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('任务', width - 105, legendY + 7);
      
      ctx.fillStyle = '#f97316';
      ctx.fillRect(width - 60, legendY, 12, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('挑战', width - 45, legendY + 7);
    },
    
    // 获取完成率数据
    getCompletionData: function(days) {
      var result = [];
      var today = new Date();
      var history = LifeGame.core.Storage.get('history') || [];
      var tasks = LifeGame.core.Storage.get('tasks') || [];
      
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        // 统计该日期的任务完成情况
        var completedTasks = history.filter(function(h) {
          return h.date === dateStr && (h.type === 'TASK_COMPLETE' || h.type === 'SUBTASK_COMPLETE');
        }).length;
        
        // 获取该日期的任务总数（从记录中估算）
        var dayTasks = tasks.filter(function(t) {
          return t.createdAt && t.createdAt.startsWith(dateStr);
        }).length;
        
        var taskRate = dayTasks > 0 ? (completedTasks / dayTasks * 100) : 0;
        
        // 挑战完成率
        var completedChallenges = history.filter(function(h) {
          return h.date === dateStr && h.type === 'CHALLENGE_COMPLETE';
        }).length;
        var challengeRate = (completedChallenges / 10 * 100); // 假设每天10个挑战
        
        result.push({
          date: dateStr,
          rate: Math.min(100, taskRate),
          challengeRate: Math.min(100, challengeRate)
        });
      }
      
      return result;
    },
    
    // 绘制任务类型饼图
    drawTaskPieChart: function() {
      var canvas = document.getElementById('task-pie-chart');
      if (!canvas) return;
      
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      var width = rect.width;
      var height = rect.height;
      var centerX = width / 2;
      var centerY = height / 2;
      var radius = Math.min(width, height) / 2 - 20;
      
      var data = this.getTaskTypeData();
      var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
      
      if (total === 0) {
        this.drawEmptyChart(ctx, width, height, '暂无任务数据');
        return;
      }
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      var colors = ['#38bdf8', '#22c55e', '#f97316', '#a855f7', '#64748b'];
      var startAngle = -Math.PI / 2;
      
      // 绘制饼图
      data.forEach(function(d, i) {
        var sliceAngle = (d.value / total) * Math.PI * 2;
        var endAngle = startAngle + sliceAngle;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制百分比标签
        var midAngle = startAngle + sliceAngle / 2;
        var labelRadius = radius * 0.7;
        var labelX = centerX + labelRadius * Math.cos(midAngle);
        var labelY = centerY + labelRadius * Math.sin(midAngle);
        var percentage = Math.round(d.value / total * 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage + '%', labelX, labelY);
        
        startAngle = endAngle;
      });
      
      // 绘制中心空心
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      
      // 中心文字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, centerX, centerY - 8);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('总任务', centerX, centerY + 8);
      
      // 更新图例
      var legendHtml = '';
      data.forEach(function(d, i) {
        legendHtml += '<div class="pie-legend-item">' +
          '<span class="legend-color" style="background: ' + colors[i % colors.length] + '"></span>' +
          '<span class="legend-name">' + d.name + '</span>' +
          '<span class="legend-value">' + d.value + '</span>' +
        '</div>';
      });
      var legendEl = document.getElementById('pie-legend');
      if (legendEl) {
        legendEl.innerHTML = legendHtml;
      }
    },
    
    // 获取任务类型数据
    getTaskTypeData: function() {
      var tasks = LifeGame.core.Storage.get('tasks') || [];
      var types = { today: 0, long: 0, inbox: 0, daily: 0, other: 0 };
      
      tasks.forEach(function(t) {
        if (t.period === 'today') types.today++;
        else if (t.period === 'long') types.long++;
        else if (t.period === 'inbox') types.inbox++;
        else if (t.daily) types.daily++;
        else types.other++;
      });
      
      return [
        { name: '今日任务', value: types.today },
        { name: '长期任务', value: types.long },
        { name: '收集箱', value: types.inbox },
        { name: '每日任务', value: types.daily },
        { name: '其他', value: types.other }
      ].filter(function(d) { return d.value > 0; });
    },
    
    // 绘制空图表提示
    drawEmptyChart: function(ctx, width, height, text) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, StatsModule);
})();
