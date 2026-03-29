# Kimi 紧急任务：修复GitHub推送问题

## 问题描述
GitHub推送被安全保护拦截，因为代码中检测到Personal Access Token。

**错误信息：**
```
GH013: Repository rule violations found
GITHUB PUSH PROTECTION
Push cannot contain secrets

暴露位置：
- commit: e65332ac... 
  path: archive/v1.2.0/lifegame.html:7923
  
- commit: e65332ac...
  path: archive/v1.2.0/lifegame_v1.0.28.html:7924
```

**GitHub解封链接：**
https://github.com/hsukuanhsiung-lang/lifegame-v2/security/secret-scanning/unblock-secret/3BUwVcBqba52XwTKwFE2JQjYCRw

---

## 解决方案（按优先级执行）

### 方案1：忽略archive文件夹（推荐）
1. 打开 `.gitignore` 文件
2. 添加以下内容：
```
# Archive folder - contains old versions with sensitive data
archive/
```
3. 从git缓存中移除archive文件夹：
```bash
git rm -r --cached archive/
git commit -m "Remove archive from tracking (contains sensitive data)"
```

### 方案2：删除敏感token
如果方案1不够，还需要：
1. 检查 `archive/v1.2.0/lifegame.html` 第7923行
2. 检查 `archive/v1.2.0/lifegame_v1.0.28.html` 第7924行
3. 删除或替换其中的GitHub token（格式：`ghp_xxxxxxxx`）
4. 替换为占位符如：`YOUR_GITHUB_TOKEN_HERE`

### 方案3：强制推送（最后手段）
如果以上都不行，访问GitHub链接手动解封，然后推送。

---

## 执行步骤

1. **先执行方案1**（添加.gitignore并移除archive缓存）
2. **尝试推送**：`git push origin main`
3. **如果还失败**，执行方案2（删除具体token）
4. **完成后在此文件末尾追加**：
```
✅ GitHub推送问题已修复于 YYYY-MM-DD HH:MM
修复方式：[方案1/2/3]
```

---

## 注意事项

- **不要**修改最新版代码中的API配置（那是Kuan的Token，需要保留功能）
- **只需要**处理archive文件夹里的历史版本
- 如果不确定，先备份再修改

---

_任务创建：Echo于2026-03-27 15:11_
