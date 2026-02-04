# AI-MindFlow | 智能思维导图

AI-MindFlow 是一款基于 AI 驱动的现代化思维导图工具，旨在通过极简的操作与强大的 AI 协作能力，帮助用户快速梳理思绪、构建知识体系。

## 🌟 核心功能

- **🚀 AI 智能创作**：一键生成思维导图分支，支持对话式内容扩充，让创意无限延伸。
- **🎨 现代化画布交互**：
  - **自动缩放**：当节点过多时，点击节点可自动放大聚焦，优化大图浏览体验。
  - **一键整理**：内置多种布局算法（树状图、折线、曲线），一键解决节点重叠，保持界面整洁。
  - **平滑动画**：所有视图切换与布局调整均配有丝滑的过渡动画。
- **🛠️ 丰富的编辑工具**：
  - 支持插入矩形、圆形、文本框等基础图形。
  - 支持上传并嵌入图片。
  - 自由连接线：可在任意节点或元素间建立逻辑关联。
- **📤 多格式导出**：
  - **高清图片**：支持导出 2 倍清晰度的 PNG 图片。
  - **结构化文档**：支持导出 Markdown (.md) 和 纯文本 (.txt) 格式，方便导入其他笔记工具。
- **🌓 响应式设计**：完美支持深色/浅色模式切换，适配各种屏幕尺寸。

## 🛠️ 技术栈

本项目基于现代前端技术栈构建，确保了极高的性能与可维护性：

- **核心框架**：[React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand) (轻量级、高性能的状态流转)
- **UI 组件库**：[shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **样式处理**：[Tailwind CSS](https://tailwindcss.com/)
- **图标库**：[Lucide React](https://lucide.dev/)
- **测试工具**：[Vitest](https://vitest.dev/)

## 🚀 快速上手

### 环境准备

确保您的本地环境已安装 [Node.js](https://nodejs.org/) (建议 v18+)。

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/ShiyouQi888/AI-MindFlow.git
   cd AI-MindFlow
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或者使用 pnpm
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 `http://localhost:8080` 即可开始使用。

## 📖 快捷键指南

- `Tab`: 添加子节点
- `Enter`: 添加同级节点
- `Delete / Backspace`: 删除选中节点/元素
- `Space`: 展开/折叠分支
- `F2`: 编辑当前选中内容
- `Esc`: 取消选中

## 🤝 贡献与反馈

如果您在使用过程中发现任何问题或有更好的建议，欢迎提交 [Issue](https://github.com/ShiyouQi888/AI-MindFlow/issues) 或发起 Pull Request。

---

Built with ❤️ by ShiyouQi888
