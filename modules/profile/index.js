/**
 * Profile Module - 角色系统
 * 灵魂形态、契合度、六属性、进化树
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'profile';
  
  // 灵魂形态配置
  var SOUL_FORMS = {
    basic: {
      id: 'basic',
      name: '混沌之魂',
      desc: '最初的形态，一团朦胧的灵魂之光',
      icon: '👻',
      cost: 0,
      unlocked: true,
      effects: '无特殊效果'
    },
    sketch: {
      id: 'sketch',
      name: '简笔之魂',
      desc: '灵魂开始有了轮廓，如简笔画般纯粹',
      icon: '✏️',
      cost: 10,
      unlocked: false,
      effects: '契合度获取+10%'
    },
    pixel: {
      id: 'pixel',
      name: '像素之魂',
      desc: '数字世界的居民，复古而坚定',
      icon: '👾',
      cost: 30,
      unlocked: false,
      effects: '契合度获取+20%，每日挑战经验+1'
    },
    crystal: {
      id: 'crystal',
      name: '水晶之魂',
      desc: '晶莹剔透，映照真实的自我',
      icon: '💎',
      cost: 100,
      unlocked: false,
      effects: '契合度获取+30%，禁止事项钻石+1'
    },
    flame: {
      id: 'flame',
      name: '烈焰之魂',
      desc: '燃烧着不灭的意志',
      icon: '🔥',
      cost: 300,
      unlocked: false,
      effects: '契合度获取+50%，全勤奖励翻倍'
    }
  };
  
  // 契合度等级
  var AFFINITY_LEVELS = [
    { min: 0, max: 10, name: '疏离', desc: '灵魂几乎无法控制肉体', color: '#ef4444' },
    { min: 10, max: 30, name: '薄弱', desc: '控制困难，容易失败', color: '#f97316' },
    { min: 30, max: 50, name: '一般', desc: '基本控制，偶尔失败', color: '#eab308' },
    { min: 50, max: 70, name: '良好', desc: '控制稳定', color: '#22c55e' },
    { min: 70, max: 90, name: '紧密', desc: '控制精准，奖励加成', color: '#3b82f6' },
    { min: 90, max: 100, name: '合一', desc: '完美控制，特殊效果', color: '#a855f7' }
  ];
  
  // 六属性
  var ATTRIBUTES = {
    hp: { name: '生命', icon: '🧬', color: '#ff9500', desc: '生命值，维持存在的基础' },
    str: { name: '力量', icon: '💪', color: '#ff3b5c', desc: '物理力量与耐力' },
    int: { name: '智力', icon: '🧠', color: '#4a9eff', desc: '思维能力与知识' },
    agi: { name: '敏捷', icon: '⚡', color: '#32d74b', desc: '反应速度与灵活性' },
    free: { name: '自由', icon: '✨', color: '#a855f7', desc: '创造力与自主性' },
    rest: { name: '休息', icon: '😴', color: '#6e6e82', desc: '恢复与放松能力' }
  };
  
  var ProfileModule = {
    currentTab: 'character', // 'character', 'appearance', 'evolution'
    
    // 事件处理器存储
    _eventHandlers: {},
    
    init: function() {
      LifeGame.log('[profile] 初始化');
      this.cleanup();
      this.initData();
      this.bindEvents();
    },
    
    // 清理资源
    cleanup: function() {
      var container = document.getElementById('world-content');
      if (container && this._eventHandlers) {
        if (this._eventHandlers.click) {
          container.removeEventListener('click', this._eventHandlers.click);
        }
        container.dataset.profileEventsBound = '';
        this._eventHandlers = {};
      }
    },
    
    initData: function() {
      var storage = LifeGame.core.Storage.data;
      
      // 初始化灵魂形态数据
      if (!storage.soulForms) {
        storage.soulForms = {
          current: 'basic',
          unlocked: ['basic'],
          forms: JSON.parse(JSON.stringify(SOUL_FORMS))
        };
      }
      
      // 初始化契合度数据
      if (!storage.affinity) {
        storage.affinity = {
          current: 0,
          history: [],
          factors: {
            challengesCompleted: 0,
            forbiddenKept: 0,
            violations: 0
          }
        };
      }
      
      // 初始化六属性数据
      if (!storage.attributes) {
        storage.attributes = {
          hp: 10,
          str: 5,
          int: 5,
          agi: 5,
          free: 5,
          rest: 5
        };
      }
      
      // 初始化角色基础数据
      if (!storage.profile) {
        storage.profile = {
          name: 'Kuan',
          level: 1,
          exp: 0,
          diamonds: 0,
          avatar: null
        };
      }
      // 确保 avatar 字段存在（兼容旧数据）
      if (storage.profile && storage.profile.avatar === undefined) {
        storage.profile.avatar = null;
      }
      
      LifeGame.core.Storage.save();
    },
    
    bindEvents: function() {
      var self = this;
      LifeGame.on('view:profile', function(data) {
        var module = LifeGame.getModule('profile');
        if (module) module.render();
      });
    },
    
    getData: function() {
      var storage = LifeGame.core.Storage.data;
      
      // 使用 AffinityManager 获取契合度数据
      var affinityData = LifeGame.core.AffinityManager ? 
        LifeGame.core.AffinityManager.getData() : 
        (storage.affinity || { current: 0, history: [], level: { name: '疏离', color: '#ef4444' } });
      
      return {
        profile: storage.profile || { name: 'Kuan', level: 1, exp: 0, diamonds: 0 },
        soulForms: storage.soulForms || { current: 'basic', unlocked: ['basic'], forms: SOUL_FORMS },
        affinity: affinityData,
        attributes: storage.attributes || { hp: 10, str: 5, int: 5, agi: 5, free: 5, rest: 5 }
      };
    },
    
    render: function(container) {
      if (!container) {
        container = document.getElementById('app');
      }
      if (!container) return;
      
      var data = this.getData();
      
      container.innerHTML = 
        '<div class="profile-container">' +
          this.renderHeader(data) +
          this.renderTabs() +
          this.renderTabContent(data) +
        '</div>';
      
      this.attachEvents();
    },
    
    renderHeader: function(data) {
      var soulForm = data.soulForms.forms[data.soulForms.current];
      var affinityLevel = this.getAffinityLevel(data.affinity.current);
      var customAvatar = data.profile.avatar;
      
      var avatarHtml = customAvatar 
        ? '<img src="' + customAvatar + '" class="profile-avatar-img" alt="头像">'
        : '<div class="profile-avatar-default">' + soulForm.icon + '</div>';
      
      return '<div class="profile-header">' +
        '<div class="profile-avatar-section">' +
          '<div class="profile-avatar" id="profile-avatar" title="点击上传头像">' + avatarHtml + '</div>' +
          '<input type="file" id="avatar-input" accept="image/*" style="display:none">' +
          '<div class="profile-soul-name">' + soulForm.name + '</div>' +
          '<div class="profile-name">' + data.profile.name + '</div>' +
        '</div>' +
        '<div class="profile-badges">' +
          '<div class="profile-badge level">Lv.' + data.profile.level + '</div>' +
          '<div class="profile-badge affinity" style="--affinity-color: ' + affinityLevel.color + '">' +
            '契合度 ' + data.affinity.current + '%' +
          '</div>' +
        '</div>' +
        '<div class="profile-currency">' +
          '<div class="currency-item diamonds">' +
            '<span class="currency-icon">💎</span>' +
            '<span class="currency-value">' + data.profile.diamonds + '</span>' +
          '</div>' +
          '<div class="currency-item exp">' +
            '<span class="currency-icon">⭐</span>' +
            '<span class="currency-value">' + data.profile.exp + ' EXP</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    },
    
    renderTabs: function() {
      var tabs = [
        { id: 'character', name: '角色', icon: '👤' },
        { id: 'appearance', name: '外观', icon: '🎨' },
        { id: 'evolution', name: '进化', icon: '🧬' }
      ];
      
      var html = '<div class="profile-tabs">';
      tabs.forEach(function(tab) {
        var active = this.currentTab === tab.id ? 'active' : '';
        html += '<div class="profile-tab ' + active + '" data-tab="' + tab.id + '">' +
          '<span class="tab-icon">' + tab.icon + '</span>' +
          '<span class="tab-name">' + tab.name + '</span>' +
        '</div>';
      }, this);
      html += '</div>';
      
      return html;
    },
    
    renderTabContent: function(data) {
      switch (this.currentTab) {
        case 'character':
          return this.renderCharacterTab(data);
        case 'appearance':
          return this.renderAppearanceTab(data);
        case 'evolution':
          return this.renderEvolutionTab(data);
        default:
          return this.renderCharacterTab(data);
      }
    },
    
    renderCharacterTab: function(data) {
      var affinityLevel = data.affinity.level || this.getAffinityLevel(data.affinity.current);
      var todayChange = data.affinity.todayChange || 0;
      var todayChangeStr = todayChange > 0 ? '(+' + todayChange + '%)' : (todayChange < 0 ? '(' + todayChange + '%)' : '');
      
      // 契合度卡片
      var affinityHtml = '<div class="profile-card affinity-card">' +
        '<div class="card-header">' +
          '<span class="card-icon">🔗</span>' +
          '<span class="card-title">契合度</span>' +
          '<span class="affinity-level" style="color: ' + affinityLevel.color + '">' + affinityLevel.name + '</span>' +
        '</div>' +
        '<div class="affinity-progress">' +
          '<div class="affinity-bar">' +
            '<div class="affinity-fill" style="width: ' + data.affinity.current + '%; background: ' + affinityLevel.color + '"></div>' +
          '</div>' +
          '<div class="affinity-value">' + data.affinity.current + '% <span class="today-change">' + todayChangeStr + '</span></div>' +
        '</div>' +
        '<div class="affinity-desc">' + affinityLevel.desc + '</div>' +
        '<div class="affinity-bonus">奖励加成: +' + (data.affinity.bonus || 0) + '%</div>' +
        '<div class="affinity-history">' + this.renderAffinityHistory(data.affinity.history) + '</div>' +
      '</div>';
      
      // 六属性卡片
      var attrsHtml = '<div class="profile-card attributes-card">' +
        '<div class="card-header">' +
          '<span class="card-icon">📊</span>' +
          '<span class="card-title">六维属性</span>' +
        '</div>' +
        '<div class="attributes-grid">';
      
      for (var key in ATTRIBUTES) {
        var attr = ATTRIBUTES[key];
        var value = data.attributes[key] || 0;
        attrsHtml += '<div class="attribute-item" style="--attr-color: ' + attr.color + '">' +
          '<div class="attr-icon">' + attr.icon + '</div>' +
          '<div class="attr-info">' +
            '<div class="attr-name">' + attr.name + '</div>' +
            '<div class="attr-value">' + value + '</div>' +
          '</div>' +
          '<div class="attr-bar">' +
            '<div class="attr-fill" style="width: ' + Math.min(value / 50 * 100, 100) + '%; background: ' + attr.color + '"></div>' +
          '</div>' +
        '</div>';
      }
      
      attrsHtml += '</div></div>';
      
      // 效果说明
      var effectsHtml = '<div class="profile-card effects-card">' +
        '<div class="card-header">' +
          '<span class="card-icon">✨</span>' +
          '<span class="card-title">当前效果</span>' +
        '</div>' +
        '<div class="effects-list">' +
          '<div class="effect-item">' +
            '<span class="effect-name">契合度等级</span>' +
            '<span class="effect-value" style="color: ' + affinityLevel.color + '">' + affinityLevel.name + '</span>' +
          '</div>' +
          '<div class="effect-item">' +
            '<span class="effect-name">契合度加成</span>' +
            '<span class="effect-value">+' + (data.affinity.bonus || 0) + '%</span>' +
          '</div>' +
          '<div class="effect-item">' +
            '<span class="effect-name">灵魂形态</span>' +
            '<span class="effect-value">' + data.soulForms.forms[data.soulForms.current].name + '</span>' +
          '</div>' +
          '<div class="effect-item">' +
            '<span class="effect-name">形态效果</span>' +
            '<span class="effect-value">' + data.soulForms.forms[data.soulForms.current].effects + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
      
      // 今日契合度报告
      var reportHtml = '';
      if (data.affinity.report && data.affinity.report.changes && data.affinity.report.changes.length > 0) {
        reportHtml = '<div class="profile-card report-card">' +
          '<div class="card-header">' +
            '<span class="card-icon">📋</span>' +
            '<span class="card-title">今日契合度变化</span>' +
          '</div>' +
          '<div class="affinity-report-list">';
        
        data.affinity.report.changes.forEach(function(change) {
          var sign = change.amount > 0 ? '+' : '';
          var color = change.amount > 0 ? '#22c55e' : (change.amount < 0 ? '#ef4444' : '#94a3b8');
          reportHtml += '<div class="report-item">' +
            '<span class="report-time">' + change.time + '</span>' +
            '<span class="report-reason">' + change.reason + '</span>' +
            '<span class="report-amount" style="color: ' + color + '">' + sign + change.amount + '%</span>' +
          '</div>';
        });
        
        reportHtml += '</div></div>';
      }
      
      return '<div class="profile-content">' + affinityHtml + attrsHtml + effectsHtml + reportHtml + '</div>';
    },
    
    renderAppearanceTab: function(data) {
      var currentForm = data.soulForms.forms[data.soulForms.current];
      
      var html = '<div class="profile-content appearance-content">' +
        '<div class="profile-card current-form-card">' +
          '<div class="current-form-display">' +
            '<div class="form-big-icon">' + currentForm.icon + '</div>' +
            '<div class="form-big-name">' + currentForm.name + '</div>' +
            '<div class="form-big-desc">' + currentForm.desc + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="profile-card">' +
          '<div class="card-header">' +
            '<span class="card-icon">🎭</span>' +
            '<span class="card-title">已解锁形态</span>' +
          '</div>' +
          '<div class="unlocked-forms-list">';
      
      data.soulForms.unlocked.forEach(function(formId) {
        var form = data.soulForms.forms[formId];
        var isCurrent = formId === data.soulForms.current;
        html += '<div class="unlocked-form-item ' + (isCurrent ? 'current' : '') + '" data-form="' + formId + '">' +
          '<span class="form-icon">' + form.icon + '</span>' +
          '<span class="form-name">' + form.name + '</span>' +
          (isCurrent ? '<span class="current-badge">当前</span>' : '<span class="switch-badge">切换</span>') +
        '</div>';
      });
      
      html += '</div></div></div>';
      return html;
    },
    
    renderEvolutionTab: function(data) {
      var html = '<div class="profile-content evolution-content">' +
        '<div class="profile-card">' +
          '<div class="card-header">' +
            '<span class="card-icon">🧬</span>' +
            '<span class="card-title">灵魂进化树</span>' +
          '</div>' +
          '<div class="evolution-tree">';
      
      for (var key in data.soulForms.forms) {
        var form = data.soulForms.forms[key];
        var canUnlock = !form.unlocked && data.profile.diamonds >= form.cost;
        var statusClass = form.unlocked ? 'unlocked' : (canUnlock ? 'can-unlock' : 'locked');
        
        html += '<div class="evolution-item ' + statusClass + '" data-form="' + key + '">' +
          '<div class="evolution-icon">' + form.icon + '</div>' +
          '<div class="evolution-info">' +
            '<div class="evolution-name">' + form.name + '</div>' +
            '<div class="evolution-desc">' + form.desc + '</div>' +
            '<div class="evolution-effects">' + form.effects + '</div>' +
          '</div>' +
          '<div class="evolution-cost">';
        
        if (form.unlocked) {
          html += '<span class="unlocked-badge">✓ 已解锁</span>';
        } else {
          html += '<span class="cost-badge ' + (canUnlock ? 'can' : 'cannot') + '">💎 ' + form.cost + '</span>';
        }
        
        html += '</div></div>';
      }
      
      html += '</div></div>' +
        '<div class="evolution-hint">' +
          '<p>💡 消耗钻石解锁新形态，获得属性加成</p>' +
          '<p>💎 钻石可通过完成禁止事项获得</p>' +
        '</div>' +
      '</div>';
      
      return html;
    },
    
    renderAffinityHistory: function(history) {
      if (!history || history.length === 0) {
        return '<div class="no-history">暂无历史记录</div>';
      }
      
      // 只显示最近7天
      var recent = history.slice(-7);
      var html = '<div class="affinity-mini-chart">';
      
      recent.forEach(function(day) {
        html += '<div class="mini-bar" style="height: ' + day.value + '%" title="' + day.date + ': ' + day.value + '%"></div>';
      });
      
      html += '</div>';
      return html;
    },
    
    getAffinityLevel: function(value) {
      for (var i = 0; i < AFFINITY_LEVELS.length; i++) {
        var level = AFFINITY_LEVELS[i];
        if (value >= level.min && value < level.max) {
          return level;
        }
      }
      return AFFINITY_LEVELS[AFFINITY_LEVELS.length - 1];
    },
    
    attachEvents: function() {
      var self = this;
      
      // 获取容器
      var container = document.getElementById('world-content');
      if (!container) return;
      
      // 防止重复绑定
      if (container.dataset.profileEventsBound === 'true') return;
      container.dataset.profileEventsBound = 'true';
      
      this._eventHandlers = {};
      
      // 事件委托
      this._eventHandlers.click = function(e) {
        // 返回按钮
        if (e.target.closest('#back-btn')) {
          LifeGame.emit('nav:back');
          return;
        }
        
        // Tab 切换
        var tab = e.target.closest('.profile-tab');
        if (tab) {
          self.currentTab = tab.dataset.tab;
          self.render(container);
          return;
        }
        
        // 外观切换
        var formItem = e.target.closest('.unlocked-form-item');
        if (formItem) {
          var formId = formItem.dataset.form;
          self.switchForm(formId);
          return;
        }
        
        // 进化解锁
        var evoItem = e.target.closest('.evolution-item.can-unlock, .evolution-item.locked');
        if (evoItem) {
          var formId = evoItem.dataset.form;
          self.unlockForm(formId);
          return;
        }
        
        // 头像上传点击
        var avatar = e.target.closest('#profile-avatar');
        if (avatar) {
          var input = document.getElementById('avatar-input');
          if (input) input.click();
          return;
        }
      };
      
      container.addEventListener('click', this._eventHandlers.click);
      
      // 头像文件选择事件
      var avatarInput = document.getElementById('avatar-input');
      if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (file) self.handleAvatarUpload(file);
        });
      }
    },
    
    // 处理头像上传
    handleAvatarUpload: function(file) {
      var self = this;
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        LifeGame.emit('notification', { message: '请选择图片文件', type: 'error' });
        return;
      }
      
      // 验证文件大小（最大 2MB）
      if (file.size > 2 * 1024 * 1024) {
        LifeGame.emit('notification', { message: '图片大小不能超过 2MB', type: 'error' });
        return;
      }
      
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          // 使用 Canvas 裁剪为圆形
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          var size = 200; // 输出尺寸
          
          canvas.width = size;
          canvas.height = size;
          
          // 创建圆形裁剪路径
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // 绘制图片（保持比例填充）
          var scale = Math.max(size / img.width, size / img.height);
          var x = (size - img.width * scale) / 2;
          var y = (size - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          // 转换为 Base64
          var avatarData = canvas.toDataURL('image/jpeg', 0.8);
          
          // 保存到 storage
          var storage = LifeGame.core.Storage.data;
          storage.profile.avatar = avatarData;
          LifeGame.core.Storage.save();
          
          // 重新渲染
          self.render();
          
          LifeGame.emit('notification', { message: '头像上传成功！', type: 'success' });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    switchForm: function(formId) {
      var storage = LifeGame.core.Storage.data;
      if (!storage.soulForms.unlocked.includes(formId)) return;
      
      storage.soulForms.current = formId;
      LifeGame.core.Storage.save();
      this.render();
      
      LifeGame.emit('notification', { message: '灵魂形态已切换为：' + storage.soulForms.forms[formId].name });
    },
    
    unlockForm: function(formId) {
      var storage = LifeGame.core.Storage.data;
      var form = storage.soulForms.forms[formId];
      
      if (form.unlocked) {
        // 已解锁，切换过去
        this.switchForm(formId);
        return;
      }
      
      if (storage.profile.diamonds < form.cost) {
        LifeGame.emit('notification', { message: '钻石不足，需要 💎' + form.cost, type: 'error' });
        return;
      }
      
      if (!confirm('确定消耗 💎' + form.cost + ' 解锁 ' + form.name + ' 吗？')) return;
      
      // 扣除钻石
      storage.profile.diamonds -= form.cost;
      form.unlocked = true;
      storage.soulForms.unlocked.push(formId);
      LifeGame.core.Storage.save();
      
      this.render();
      LifeGame.emit('notification', { message: '🎉 解锁成功：' + form.name, type: 'success' });
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, ProfileModule);
})();
