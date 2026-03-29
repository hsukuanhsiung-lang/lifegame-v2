# 浏览器调试指南 — Next 专用

_如何使用 agent-browser 工具检查 LifeGame 网页渲染问题_

---

## 工具位置

```
C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe
```

---

## 常用命令

### 1. 打开本地网页
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  --allow-file-access `
  open "file:///C:/Users/kuanh/Desktop/Next/LifeGame/index.html"
```

### 2. 截图保存
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  screenshot "C:\Users\kuanh\Desktop\lifegame_screenshot.png"
```

### 3. 点击元素（通过文字）
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  find text "表世界" click
```

### 4. 获取元素高度（用于调试 CSS）
```powershell
# 获取二级标签栏高度
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  eval "document.querySelector('.nav-level-2').getBoundingClientRect().height"

# 获取标签按钮高度
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  eval "document.querySelector('.secondary-tab').getBoundingClientRect().height"

# 获取任意元素高度
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  eval "document.querySelector('#element-id').getBoundingClientRect().height"
```

### 5. 获取计算样式
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  eval "getComputedStyle(document.querySelector('.nav-level-2')).height"
```

### 6. 关闭浏览器
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" close
```

---

## 完整调试流程示例

```powershell
# 1. 打开网页
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  --allow-file-access `
  open "file:///C:/Users/kuanh/Desktop/Next/LifeGame/index.html"

# 2. 点击"表世界"进入二级标签页面
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  find text "表世界" click

# 3. 截图保存
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  screenshot "C:\Users\kuanh\Desktop\lifegame_level2.png"

# 4. 检查二级标签栏高度
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  eval "document.querySelector('.nav-level-2').getBoundingClientRect().height"

# 5. 关闭浏览器
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" close
```

---

## 更多高级命令

### 批量执行多个命令
```powershell
# 使用 && 连接多个命令
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" `
  open "file:///C:/..." && `
  find text "表世界" click && `
  screenshot "result.png"
```

### 获取页面快照（可交互元素列表）
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" snapshot
```

### 等待页面加载完成
```powershell
& "C:\Users\kuanh\.openclaw\skills\agent-browser\bin\agent-browser-win32-x64.exe" wait --load networkidle
```

---

## 故障排除

### 问题：命令超时
**解决**：增加 timeout 参数
```powershell
# 在 PowerShell 中设置超时
$env:AGENT_BROWSER_DEFAULT_TIMEOUT=45000
```

### 问题：文件访问被拒绝
**解决**：确保使用 `--allow-file-access` 参数打开本地文件

### 问题：找不到 Chrome
**解决**：agent-browser 会自动查找系统 Chrome，或设置环境变量
```powershell
$env:AGENT_BROWSER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

---

## 参考文档

完整文档：`C:\Users\kuanh\.openclaw\skills\agent-browser\README.md`

---

_最后更新：2026-03-20_
_版本：v1.0_
