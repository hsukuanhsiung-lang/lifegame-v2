# Life Game v2.0

> 🎮 把人生当作游戏，让成长变得有趣

---

## 📱 在线体验

GitHub Pages: `https://[你的用户名].github.io/LifeGame`

---

## 📁 文件结构

```
LifeGame/
├── index.html              ← 入口文件
├── main.js                 ← 应用启动器
├── README.md               ← 本文件
├── .gitignore              ← Git忽略配置
│
├── css/                    ← 样式文件
│   └── main.css           (全局样式)
│
├── core/                   ← 核心模块
│   ├── namespace.js       (命名空间/事件系统)
│   ├── storage.js         (数据存储管理)
│   ├── renderer.js        (渲染引擎)
│   ├── theme-manager.js   (主题管理)
│   ├── affinity-manager.js(契合度系统)
│   ├── nav-controller.js  (导航控制器)
│   ├── utils.js           (公共工具函数)
│   ├── mobile-utils.js    (移动端工具)
│   ├── drag-mouse.js      (拖拽排序)
│   └── loading-manager.js (加载状态管理)
│
├── modules/                ← 功能模块
│   ├── world-selector/    (世界选择器)
│   ├── overview/          (概览页面)
│   ├── tasks/             (任务系统)
│   ├── challenges/        (挑战/禁止事项)
│   ├── timeline/          (时间轨迹)
│   ├── action/            (行动系统)
│   ├── profile/           (角色/契合度)
│   ├── guide/             (AI向导)
│   ├── history/           (历史记录)
│   ├── settings/          (设置)
│   ├── idle/              (挂机系统-开发中)
│   ├── shop/              (商店-开发中)
│   ├── inventory/         (背包-开发中)
│   ├── town/              (城镇-开发中)
│   └── stats/             (统计图表-开发中)
│
├── data/                   ← 数据文件
│   └── default.json       (默认数据结构)
│
├── docs/                   ← 项目文档
│   ├── Wiz核心设定.md
│   ├── 设定文档.md
│   └── ...
│
├── 设定/                   ← 详细设定文档
└── archive/                ← 归档旧版本
```

---

## 🚀 快速开始

### 1. 本地开发

```bash
# 使用 Python 启动本地服务器（推荐）
python -m http.server 8000

# 然后访问 http://localhost:8000
```

Windows 用户也可以双击 `启动开发服务器.bat`

### 2. GitHub Pages 部署

1. Fork 或上传代码到 GitHub 仓库
2. 进入 Settings → Pages
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "main"，文件夹选择 "/ (root)"
5. 保存后即可访问 `https://[用户名].github.io/[仓库名]`

---

## 📱 移动端适配

### 已完成的移动端优化

| 功能 | 状态 |
|------|------|
| 响应式布局 | ✅ 支持 320px+ 屏幕 |
| 触摸事件 | ✅ 长按替代双击 |
| 拖拽排序 | ✅ 触摸拖拽支持 |
| 视口适配 | ✅ viewport 配置 |
| 加载状态 | ✅ 网络延迟反馈 |

### 推荐测试设备

- iOS: Safari (iPhone 12/13/14)
- Android: Chrome (Pixel/Samsung)
- 微信内置浏览器

---

## 🏗️ 架构说明

### 模块系统

```
LifeGame (全局命名空间)
    ├── core (核心系统)
    │   ├── Storage    (数据持久化)
    │   ├── Renderer   (渲染引擎)
    │   └── ...
    ├── modules (功能模块)
    │   ├── tasks
    │   ├── challenges
    │   └── ...
    └── data (默认数据)
```

### 事件系统

```javascript
// 发布事件
LifeGame.emit('task:completed', { taskId: 'xxx' });

// 订阅事件
LifeGame.on('task:completed', function(data) {
    console.log('任务完成:', data.taskId);
});
```

---

## 🔧 开发指南

### 添加新模块

1. 创建文件 `modules/mymodule/index.js` 和 `style.css`
2. 在 `index.html` 中引入
3. 在 `main.js` 的 `moduleNames` 数组中添加模块名
4. 实现标准接口：`init()`, `render()`, `cleanup()`

### 代码规范

```javascript
(function() {
  'use strict';
  
  var MODULE_NAME = 'my-module';
  
  var MyModule = {
    init: function() {
      // 初始化
    },
    
    render: function(container) {
      // 渲染到容器
    },
    
    cleanup: function() {
      // 清理资源
    }
  };
  
  LifeGame.registerModule(MODULE_NAME, MyModule);
})();
```

---

## 🛠️ 技术栈

- **前端**: 纯 HTML5 / CSS3 / JavaScript (ES5+，无框架)
- **存储**: LocalStorage
- **字体**: Google Fonts (Press Start 2P)
- **图标**: Emoji

---

## 📦 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0 | 2026-03-29 | 模块化重构完成，加载状态系统 |
| v1.2.0 | 2026-03-19 | 模块化版本 |

---

## 🐛 已知问题

### 移动端
- 部分 Android 浏览器可能需要关闭省电模式才能正常显示动画
- iOS Safari 的橡皮筋效果可能影响拖拽体验

### 桌面端
- 建议使用 Chrome/Edge 获得最佳体验
- Firefox 部分 CSS 动画可能略有差异

---

## 📄 许可证

个人项目，仅供学习交流使用。

---

_🎮 人生游戏 - 让每一天都有迹可循_
