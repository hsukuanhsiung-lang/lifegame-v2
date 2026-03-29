# 开发模式指南 - 解决浏览器缓存问题

## 问题
每次修改 CSS/JS 后，Live Server 刷新但浏览器仍显示旧版本。

## 解决方案（任选一种）

### 方案1：使用开发模式入口（推荐）

**步骤**：
1. 开发时打开：`http://127.0.0.1:5500/dev-mode.html`
2. 这个页面会自动清除缓存并跳转到主页面（带时间戳）
3. 之后正常操作即可，所有资源都会强制刷新

### 方案2：Chrome 开发者设置

**步骤**：
1. 按 `F12` 打开开发者工具
2. 点击 **Network（网络）** 标签
3. 勾选 **"Disable cache"（禁用缓存）** 复选框
4. 保持开发者工具打开，刷新页面

> 注意：关闭开发者工具后此设置失效

### 方案3：无痕模式

直接按 `Ctrl+Shift+N` 打开无痕窗口访问 Live Server 地址。

无痕模式不会缓存资源，每次打开都是最新版本。

### 方案4：硬刷新快捷键

| 操作 | Windows | Mac |
|:---|:---|:---|
| 硬刷新 | `Ctrl + Shift + R` | `Cmd + Shift + R` |
| 或 | `Ctrl + F5` | `Cmd + F5` |

### 方案5：修改 index.html 触发刷新

在 `index.html` 中随便修改一处（比如加个空格），保存后 Live Server 会强制刷新所有资源。

---

## 推荐工作流

### 日常开发
```
1. 右键 index.html → Open with Live Server
2. 浏览器打开 dev-mode.html 清除缓存
3. 正常开发，CSS/JS 修改会自动刷新
```

### 如果还是没变化
```
1. F12 打开开发者工具
2. Network 标签页勾选 "Disable cache"
3. Ctrl+Shift+R 硬刷新
```

---

## 永久解决（index.html 已配置）

`index.html` 已添加以下代码：
- 禁用缓存的 meta 标签
- Live Server 下自动给 CSS 添加时间戳

下次开发时，打开 `dev-mode.html` 即可自动进入无缓存模式。
