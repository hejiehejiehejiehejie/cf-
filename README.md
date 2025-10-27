# QwQ
为 Codeforces 题目页面设计的用户脚本，优化阅读体验并提供便捷功能。

## 功能
- **隐藏侧边栏**：一键隐藏 Codeforces 侧边栏，内容全屏展示，适配宽窄屏幕（无整页横向滚动条）。
- **Markdown 复制**：点击按钮或 Ctrl+M 复制题目链接为 `[CF{ID}{Index}] - 标题` 格式，便于笔记整理。
- **自动隐藏偏好**：通过按钮设置自动隐藏侧边栏（Alt+Q 手动切换不影响偏好）。
- **视觉优化**：正文、工具条、提交代码容器与正文对齐，左右留白舒适，超宽内容（如表格/代码）局部滚动。
- **响应式设计**：适配不同屏幕尺寸，内容完整显示无裁剪。

## 安装
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展（支持 Chrome、Edge、Firefox、Safari）。
2. 点击 [Install this script](#)（替换为 Greasy Fork 的 Install 链接）。
3. 在 Tampermonkey 弹窗中点击“安装”。

## 使用
- **复制 Markdown**：点击复制按钮（或 Ctrl+M）获取题目链接。
- **隐藏侧边栏**：
  - Alt+Q：手动切换侧边栏显示/隐藏。
  - 自动隐藏开关：设置新页面加载时是否自动隐藏（不影响当前页）。
- **提交代码**：提交表单与正文对齐，视觉一致。


## 常见问题
- **脚本未生效？** 确保页面匹配 `@match`（如 `https://codeforces.com/problemset/problem/*/*`），或刷新页面。
- **横向滚动？** 已强制裁切整页滚动条，表格/代码局部可滚；若需代码折行，联系作者。
- **更新频率？** 自动检查更新（需正确配置 `@updateURL`）。

## 支持
- 问题反馈：[GitHub Issues](https://github.com/USER/REPO/issues)
- 源码/更新：[GitHub Repository](https://github.com/USER/REPO)
- 许可：MIT

## 变更日志
- **3.8**（2025-10-27）：工具条/提交容器与正文对齐；自动隐藏开关仅设置偏好（Alt+Q 不改变状态）；强制裁切整页横向滚动。
- **3.7**：强制裁切横向溢出，消除页面滚动条。
- **3.6**：添加左右留白，修复右侧裁剪问题。

---

**感谢使用！欢迎 Star 或反馈改进建议！**
