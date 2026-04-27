# 道经解义

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-orange?logo=google&logoColor=white)](https://aistudio.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

一个沉浸式的道家典籍在线阅读平台，深度集成了 AI 会话助手，旨在通过现代科技辅助探索中国古代智慧。

## ✨ 特性

-   **📚 经典荟萃**：内置《老子》（道德经）、《庄子》、《列子》及《阴符经》的高质量校对文本。
-   **🤖 AI 深度解析**：支持通过 AI 模型对章节进行实时解读、答疑与哲学探讨。
-   **🎨 现代审美**：极简主义界面设计，支持平滑的章节切换动画与沉浸式阅读体验。
-   **⚙️ 灵活配置**：支持国内外主流模型与自定义 LLM 接入，满足不同用户的需求。
-   **💾 数据安全**：所有阅读进度与个人笔记均存储于本地，支持导出与导入备份。
-   **📱 响应式设计**：完美适配桌面端与移动端浏览器。

## 🛠️ 技术栈

-   **核心框架**：React 19 (TypeScript)
-   **构建工具**：Vite 6
-   **样式处理**：Tailwind CSS 4
-   **动画引擎**：Framer Motion (Motion)
-   **图标库**：Lucide React
-   **AI 集成**：@google/genai (Google Gemini SDK)
-   **路由**：React Router 7

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/corkine/taoism-website.git
cd taoism-website
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm run dev
```

## 📦 部署

运行以下命令构建生产版本：

```bash
pnpm run build
```

构建产物将位于 `dist` 目录下，可部署至任意静态托管平台（如 GitHub Pages, Vercel, Netlify 等）。

## 📝 文本声明

本应用使用的《老子》原文主要参考自王弼本，并结合帛书本、竹简本等进行了部分校勘；《庄子》原文主要参考自郭象本，二者均经过了重新校对与标点整理。

内置的典籍原文属于公有领域。本应用本身的界面设计、交互逻辑及提供的工具代码受版权保护。

---

**Powered by Gemini with Google AI Studio**