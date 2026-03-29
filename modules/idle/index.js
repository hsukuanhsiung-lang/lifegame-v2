/**
 * Idle Module - 里世界挂机系统
 * 俯视Roguelike视角，自动战斗，时间收益
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'idle';
  
  // 6大区域配置
  var REGIONS = {
    newbie: {
      id: 'newbie',
      name: '新手村废墟',
      icon: '🏚️',
      color: '#8B7355',
      minLevel: 'F',
      fragments: { white: 30, gray: 1 }, // 每小时收益
      monsters: ['👾', '🐀', '🦇'],
      description: '破败的村庄，适合新手灵魂修炼'
    },
    temple: {
      id: 'temple', 
      name: '属性圣殿',
      icon: '⛪',
      color: '#FFD700',
      minLevel: 'E',
      fragments: { gray: 25, green: 2 },
      monsters: ['👺', '👹', '👻'],
      description: '神圣殿堂，元素守卫徘徊'
    },
    command: {
      id: 'command',
      name: '作战指挥室', 
      icon: '🏢',
      color: '#4A5568',
      minLevel: 'D',
      fragments: { green: 20, blue: 3 },
      monsters: ['🤖', '👽', '👾'],
      description: '军事基地，机械兽巡逻'
    },
    memory: {
      id: 'memory',
      name: '记忆回廊',
      icon: '🌌',
      color: '#9F7AEA',
      minLevel: 'C', 
      fragments: { blue: 15, purple: 4 },
      monsters: ['👻', '🧟', '👽'],
      description: '时空隧道，幻影游荡'
    },
    mine: {
      id: 'mine',
      name: '钻石矿坑',
      icon: '⛏️',
      color: '#38A169',
      minLevel: 'B',
      fragments: { purple: 10, orange: 5 },
      monsters: ['💀', '🧟', '👹'],
      description: '地下矿洞，矿工僵尸出没'
    },
    seal: {
      id: 'seal',
      name: '封印之门',
      icon: '🚪',
      color: '#E53E3E',
      minLevel: 'A',
      fragments: { orange: 8, red: 6 },
      monsters: ['👹', '👺', '🐉'],
      description: '深渊入口，大隐兽封印于此'
    }
  };
  
  // 挂机状态
  var idleState = {
    isRunning: false,
    region: 'newbie',
    startTime: null,
    playerPos: { x: 100, y: 100 },
    monsters: [],
    kills: 0,
    fragments: { white: 0, gray: 0, green: 0, blue: 0, purple: 0, orange: 0, red: 0 },
    animationId: null
  };
  
  var IdleModule = {
    init: function() {
      LifeGame.log('[idle] 初始化');
      this.loadData();
    },
    
    loadData: function() {
      var storage = LifeGame.core.Storage.data;
      var idle = storage.idle || {};
      idleState.region = idle.region || 'newbie';
      idleState.fragments = idle.fragments || { white: 0, gray: 0, green: 0, blue: 0, purple: 0, orange: 0, red: 0 };
    },
    
    saveData: function() {
      LifeGame.core.Storage.set('idle', {
        region: idleState.region,
        fragments: idleState.fragments,
        totalKills: idleState.kills
      });
    },
    
    render: function() {
      var container = document.getElementById('app');
      if (!container) return;
      
      if (idleState.isRunning) {
        this.renderBattle();
      } else {
        this.renderRegionSelect();
      }
    },
    
    // 区域选择界面
    renderRegionSelect: function() {
      var html = '<div class="idle-container">';
      
      // 标题 + 返回按钮
      html += '<div class="idle-header">';
      html += '<button class="back-btn" onclick="LifeGame.emit(\'nav:back\')">← 返回</button>';
      html += '<h2>⚔️ 里世界 · 离线挂机</h2>';
      html += '<p style="color: var(--text2); font-size: 13px;">选择区域开始灵魂修炼</p>';
      html += '</div>';
      
      // 区域列表
      html += '<div class="region-grid">';
      for (var key in REGIONS) {
        var region = REGIONS[key];
        var isLocked = this.isRegionLocked(region);
        html += '<div class="region-card ' + (isLocked ? 'locked' : '') + '" onclick="IdleModule.selectRegion(\'' + key + '\')">';
        html += '<div class="region-icon" style="background: ' + region.color + '22; color: ' + region.color + '">' + region.icon + '</div>';
        html += '<div class="region-name">' + region.name + '</div>';
        html += '<div class="region-level">等级: ' + region.minLevel + '+</div>';
        if (!isLocked) {
          html += '<div class="region-reward">💎 ' + this.formatFragments(region.fragments) + '/小时</div>';
        } else {
          html += '<div class="region-locked">🔒 未解锁</div>';
        }
        html += '</div>';
      }
      html += '</div>';
      
      // 当前收益统计
      html += '<div class="idle-stats">';
      html += '<h3>📊 累计收益</h3>';
      html += this.renderFragments(idleState.fragments);
      html += '</div>';
      
      html += '</div>';
      document.getElementById('app').innerHTML = html;
    },
    
    // 战斗界面
    renderBattle: function() {
      var region = REGIONS[idleState.region];
      var elapsed = Math.floor((Date.now() - idleState.startTime) / 1000);
      var hours = Math.floor(elapsed / 3600);
      var mins = Math.floor((elapsed % 3600) / 60);
      
      // 使用导航 API 推入子页面
      if (window.NavController && NavController.pushToNavStack && !this._fromBack) {
        NavController.pushToNavStack();
        this._fromBack = false;
      }
      
      var html = '<div class="battle-container">';
      
      // 顶部信息
      html += '<div class="battle-header">';
      html += '<button class="back-btn" onclick="IdleModule.stopIdle()">← 返回</button>';
      html += '<div class="battle-info">';
      html += '<div class="region-name">' + region.icon + ' ' + region.name + '</div>';
      html += '<div class="battle-time">⏱️ ' + hours + '小时' + mins + '分钟</div>';
      html += '</div>';
      html += '</div>';
      
      // 战斗画面（Canvas区域）
      html += '<div class="battle-canvas" id="battle-canvas">';
      html += '<div class="player-soul">🧙‍♂️</div>';
      html += '<div class="battle-log" id="battle-log">灵魂开始修炼...</div>';
      html += '</div>';
      
      // 实时统计
      html += '<div class="battle-stats">';
      html += '<div class="stat-item">';
      html += '<div class="stat-value">' + idleState.kills + '</div>';
      html += '<div class="stat-label">击杀</div>';
      html += '</div>';
      html += '<div class="stat-item fragments">';
      html += this.renderFragmentsMini(idleState.fragments);
      html += '</div>';
      html += '</div>';
      
      html += '</div>';
      document.getElementById('app').innerHTML = html;
      
      // 启动动画循环
      this.startAnimation();
    },
    
    // 选择区域
    selectRegion: function(regionId) {
      if (this.isRegionLocked(REGIONS[regionId])) {
        showToast('区域未解锁，请先提升灵魂等级');
        return;
      }
      idleState.region = regionId;
      this.startIdle();
    },
    
    // 开始挂机
    startIdle: function() {
      idleState.isRunning = true;
      idleState.startTime = Date.now();
      idleState.kills = 0;
      idleState.monsters = this.spawnMonsters();
      this.render();
      
      // 启动收益计算
      this.startEarning();
    },
    
    // 停止挂机
    stopIdle: function() {
      idleState.isRunning = false;
      if (idleState.animationId) {
        cancelAnimationFrame(idleState.animationId);
      }
      
      // 计算最终收益
      var elapsed = (Date.now() - idleState.startTime) / 1000 / 3600; // 小时
      var region = REGIONS[idleState.region];
      this.calculateEarnings(elapsed, region.fragments);
      
      this.saveData();
      this._fromBack = true;
      
      // 使用导航 API 返回
      if (window.NavController && NavController.popFromNavStack) {
        NavController.popFromNavStack();
      } else {
        this.render();
      }
      
      showToast('挂机结束，收益已保存');
    },
    
    // 生成怪物
    spawnMonsters: function() {
      var region = REGIONS[idleState.region];
      var monsters = [];
      for (var i = 0; i < 5; i++) {
        monsters.push({
          id: i,
          icon: region.monsters[Math.floor(Math.random() * region.monsters.length)],
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 150,
          hp: 100
        });
      }
      return monsters;
    },
    
    // 启动动画循环
    startAnimation: function() {
      var self = this;
      var canvas = document.getElementById('battle-canvas');
      if (!canvas) return;
      
      function animate() {
        if (!idleState.isRunning) return;
        
        // 更新玩家位置（自动寻路向最近的怪物）
        self.updatePlayerPosition();
        
        // 渲染怪物
        self.renderMonsters(canvas);
        
        idleState.animationId = requestAnimationFrame(animate);
      }
      
      animate();
    },
    
    // 更新玩家位置（简单自动寻路）
    updatePlayerPosition: function() {
      if (idleState.monsters.length === 0) {
        // 重新生成怪物
        idleState.monsters = this.spawnMonsters();
      }
      
      // 找到最近的怪物
      var nearest = idleState.monsters[0];
      var minDist = this.distance(idleState.playerPos, nearest);
      
      for (var i = 1; i < idleState.monsters.length; i++) {
        var dist = this.distance(idleState.playerPos, idleState.monsters[i]);
        if (dist < minDist) {
          minDist = dist;
          nearest = idleState.monsters[i];
        }
      }
      
      // 向怪物移动
      var speed = 2;
      var dx = nearest.x - idleState.playerPos.x;
      var dy = nearest.y - idleState.playerPos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        idleState.playerPos.x += (dx / dist) * speed;
        idleState.playerPos.y += (dy / dist) * speed;
      } else {
        // 碰撞，攻击
        this.attackMonster(nearest);
      }
    },
    
    // 计算距离
    distance: function(p1, p2) {
      var dx = p1.x - p2.x;
      var dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 攻击怪物
    attackMonster: function(monster) {
      monster.hp -= 10;
      
      if (monster.hp <= 0) {
        // 击杀
        idleState.kills++;
        idleState.monsters = idleState.monsters.filter(function(m) { return m.id !== monster.id; });
        
        // 显示击杀日志
        var log = document.getElementById('battle-log');
        if (log) {
          log.textContent = '击杀 ' + monster.icon + '！总击杀: ' + idleState.kills;
        }
      }
    },
    
    // 渲染怪物
    renderMonsters: function(canvas) {
      // 清除旧的怪物DOM
      var oldMonsters = canvas.querySelectorAll('.monster');
      oldMonsters.forEach(function(el) { el.remove(); });
      
      // 渲染新位置
      idleState.monsters.forEach(function(monster) {
        var el = document.createElement('div');
        el.className = 'monster';
        el.textContent = monster.icon;
        el.style.left = monster.x + 'px';
        el.style.top = monster.y + 'px';
        canvas.appendChild(el);
      });
      
      // 更新玩家位置
      var player = canvas.querySelector('.player-soul');
      if (player) {
        player.style.left = idleState.playerPos.x + 'px';
        player.style.top = idleState.playerPos.y + 'px';
      }
    },
    
    // 启动收益计算
    startEarning: function() {
      var self = this;
      setInterval(function() {
        if (!idleState.isRunning) return;
        
        var region = REGIONS[idleState.region];
        var fragments = region.fragments;
        
        // 每小时计算一次（简化版）
        for (var color in fragments) {
          idleState.fragments[color] += fragments[color] / 3600; // 每秒收益
        }
      }, 1000);
    },
    
    // 计算最终收益
    calculateEarnings: function(hours, baseFragments) {
      // 基础收益 × 时间
      for (var color in baseFragments) {
        idleState.fragments[color] += baseFragments[color] * hours;
      }
    },
    
    // 检查区域是否锁定
    isRegionLocked: function(region) {
      // 简化版：根据用户等级判断
      var userLevel = LifeGame.core.Storage.get('soulLevel') || 'F';
      var levels = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
      return levels.indexOf(userLevel) < levels.indexOf(region.minLevel);
    },
    
    // 格式化碎片显示
    formatFragments: function(fragments) {
      var parts = [];
      if (fragments.white) parts.push('白×' + fragments.white);
      if (fragments.gray) parts.push('灰×' + fragments.gray);
      if (fragments.green) parts.push('绿×' + fragments.green);
      if (fragments.blue) parts.push('蓝×' + fragments.blue);
      return parts.join(' ');
    },
    
    // 渲染碎片详细
    renderFragments: function(fragments) {
      var colors = {
        white: { name: '白色', emoji: '⚪' },
        gray: { name: '灰色', emoji: '⚫' },
        green: { name: '绿色', emoji: '🟢' },
        blue: { name: '蓝色', emoji: '🔵' },
        purple: { name: '紫色', emoji: '🟣' },
        orange: { name: '橙色', emoji: '🟠' },
        red: { name: '红色', emoji: '🔴' }
      };
      
      var html = '<div class="fragments-grid">';
      for (var key in fragments) {
        if (fragments[key] > 0) {
          html += '<div class="fragment-item">';
          html += '<span class="fragment-icon">' + colors[key].emoji + '</span>';
          html += '<span class="fragment-name">' + colors[key].name + '</span>';
          html += '<span class="fragment-count">' + Math.floor(fragments[key]) + '</span>';
          html += '</div>';
        }
      }
      html += '</div>';
      return html;
    },
    
    // 渲染碎片简化版
    renderFragmentsMini: function(fragments) {
      var total = 0;
      for (var key in fragments) {
        total += fragments[key];
      }
      return '<div class="fragments-mini">💎 ' + Math.floor(total) + ' 碎片</div>';
    }
  };
  
  // 注册模块
  LifeGame.modules = LifeGame.modules || {};
  LifeGame.modules[MODULE_NAME] = IdleModule;
  
  // 暴露全局
  window.IdleModule = IdleModule;
})();
