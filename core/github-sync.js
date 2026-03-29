/**
 * GitHub Sync - 数据自动同步到 GitHub
 * 将 LocalStorage 数据备份到 GitHub 仓库
 */

(function() {
  'use strict';
  
  var MODULE_NAME = 'github-sync';
  
  var GitHubSync = {
    // 配置
    REPO: 'hsukuanhsiung-lang/lifegame-v2',
    FILE_PATH: 'data/sync-data.json',
    DEBOUNCE_MS: 30000, // 30秒防抖
    
    // 状态
    _syncTimer: null,
    _isSyncing: false,
    _lastSyncTime: null,
    _lastError: null,
    
    /**
     * 初始化
     */
    init: function() {
      LifeGame.log('[GitHubSync] 初始化');
      this._loadStatus();
    },
    
    /**
     * 从 LocalStorage 加载同步状态
     */
    _loadStatus: function() {
      var status = LifeGame.core.Storage.get('githubSyncStatus');
      if (status) {
        this._lastSyncTime = status.lastSyncTime || null;
        this._lastError = status.lastError || null;
      }
    },
    
    /**
     * 保存同步状态
     */
    _saveStatus: function() {
      LifeGame.core.Storage.set('githubSyncStatus', {
        lastSyncTime: this._lastSyncTime,
        lastError: this._lastError
      });
    },
    
    /**
     * 获取 GitHub Token
     * @returns {string|null}
     */
    getToken: function() {
      return LifeGame.core.Storage.get('lg_github_token') || null;
    },
    
    /**
     * 检查是否已配置
     * @returns {boolean}
     */
    isConfigured: function() {
      return !!this.getToken();
    },
    
    /**
     * 检查是否启用自动同步
     * @returns {boolean}
     */
    isEnabled: function() {
      return LifeGame.core.Storage.get('githubSyncEnabled') !== false;
    },
    
    /**
     * 设置启用/禁用自动同步
     * @param {boolean} enabled
     */
    setEnabled: function(enabled) {
      LifeGame.core.Storage.set('githubSyncEnabled', enabled);
      LifeGame.log('[GitHubSync] 自动同步已' + (enabled ? '启用' : '禁用'));
    },
    
    /**
     * 设置 GitHub Token
     * @param {string} token
     */
    setToken: function(token) {
      if (token) {
        LifeGame.core.Storage.set('lg_github_token', token);
        LifeGame.log('[GitHubSync] Token 已设置');
      } else {
        LifeGame.core.Storage.set('lg_github_token', null);
        LifeGame.log('[GitHubSync] Token 已清除');
      }
    },
    
    /**
     * 获取同步状态
     * @returns {Object}
     */
    getStatus: function() {
      return {
        configured: this.isConfigured(),
        enabled: this.isEnabled(),
        syncing: this._isSyncing,
        lastSyncTime: this._lastSyncTime,
        lastError: this._lastError
      };
    },
    
    /**
     * 收集要同步的数据
     * @returns {Object}
     */
    _collectData: function() {
      var data = {};
      var storage = LifeGame.core.Storage.data;
      
      // 复制所有数据
      for (var key in storage) {
        if (storage.hasOwnProperty(key)) {
          data[key] = storage[key];
        }
      }
      
      return {
        syncTime: new Date().toISOString(),
        version: '1.3.0',
        device: navigator.userAgent,
        data: data
      };
    },
    
    /**
     * 同步数据到 GitHub
     * @returns {Promise}
     */
    sync: function() {
      var self = this;
      
      // 检查配置
      if (!this.isConfigured()) {
        LifeGame.log('[GitHubSync] 未配置 Token，跳过同步');
        return Promise.resolve({ skipped: true, reason: 'not_configured' });
      }
      
      // 检查是否启用
      if (!this.isEnabled()) {
        LifeGame.log('[GitHubSync] 自动同步已禁用，跳过');
        return Promise.resolve({ skipped: true, reason: 'disabled' });
      }
      
      // 避免重复同步
      if (this._isSyncing) {
        LifeGame.log('[GitHubSync] 正在同步中，跳过');
        return Promise.resolve({ skipped: true, reason: 'in_progress' });
      }
      
      this._isSyncing = true;
      this._lastError = null;
      
      // 触发同步开始事件
      LifeGame.emit('githubsync:start');
      
      var token = this.getToken();
      var syncData = this._collectData();
      var content = btoa(unescape(encodeURIComponent(JSON.stringify(syncData, null, 2))));
      
      LifeGame.log('[GitHubSync] 开始同步...');
      
      // 第一步：获取现有文件的 sha
      return this._getFileSha(token)
        .then(function(sha) {
          // 第二步：更新文件
          return self._updateFile(token, content, sha);
        })
        .catch(function(err) {
          // 如果文件不存在（404），创建新文件
          if (err.status === 404) {
            LifeGame.log('[GitHubSync] 文件不存在，创建新文件');
            return self._updateFile(token, content, null);
          }
          throw err;
        })
        .then(function(result) {
          self._lastSyncTime = new Date().toISOString();
          self._saveStatus();
          self._isSyncing = false;
          
          LifeGame.log('[GitHubSync] 同步成功:', result.commit.sha.substring(0, 8));
          LifeGame.emit('githubsync:success', { time: self._lastSyncTime });
          
          return { success: true, time: self._lastSyncTime };
        })
        .catch(function(err) {
          self._lastError = err.message || 'Unknown error';
          self._saveStatus();
          self._isSyncing = false;
          
          console.error('[GitHubSync] 同步失败:', err);
          LifeGame.emit('githubsync:error', { error: self._lastError });
          
          // 同步失败不影响本地使用
          return { success: false, error: self._lastError };
        });
    },
    
    /**
     * 获取文件 sha
     * @param {string} token
     * @returns {Promise<string|null>}
     */
    _getFileSha: function(token) {
      var url = 'https://api.github.com/repos/' + this.REPO + '/contents/' + this.FILE_PATH;
      
      return fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      .then(function(res) {
        if (!res.ok) {
          if (res.status === 404) {
            return null; // 文件不存在
          }
          throw { status: res.status, message: res.statusText };
        }
        return res.json();
      })
      .then(function(data) {
        return data ? data.sha : null;
      });
    },
    
    /**
     * 更新文件
     * @param {string} token
     * @param {string} content - base64 编码的内容
     * @param {string|null} sha - 现有文件的 sha（更新时需要）
     * @returns {Promise}
     */
    _updateFile: function(token, content, sha) {
      var url = 'https://api.github.com/repos/' + this.REPO + '/contents/' + this.FILE_PATH;
      
      var body = {
        message: 'LifeGame sync: ' + new Date().toLocaleString('zh-CN'),
        content: content
      };
      
      if (sha) {
        body.sha = sha;
      }
      
      return fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      .then(function(res) {
        if (!res.ok) {
          throw { status: res.status, message: res.statusText };
        }
        return res.json();
      });
    },
    
    /**
     * 带防抖的同步
     */
    debouncedSync: function() {
      var self = this;
      
      // 清除之前的定时器
      if (this._syncTimer) {
        clearTimeout(this._syncTimer);
      }
      
      // 设置新的定时器
      this._syncTimer = setTimeout(function() {
        self.sync();
      }, this.DEBOUNCE_MS);
      
      LifeGame.log('[GitHubSync] 同步已延迟 ' + this.DEBOUNCE_MS + 'ms');
    },
    
    /**
     * 手动触发同步（立即执行）
     * @returns {Promise}
     */
    syncNow: function() {
      // 清除延迟的同步
      if (this._syncTimer) {
        clearTimeout(this._syncTimer);
        this._syncTimer = null;
      }
      
      return this.sync();
    }
  };
  
  // 注册模块
  LifeGame.registerModule(MODULE_NAME, GitHubSync);
  
  // 全局快捷方法
  LifeGame.syncToGitHub = function() {
    return GitHubSync.syncNow();
  };
  
})();
