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
-   **💾 数据安全**：阅读进度与个人笔记存储于本地，支持导出备份。
-   **🔄 WebDAV 同步**：支持跨设备云端同步，具备智能冲突检测与自动快进功能。
-   **📱 响应式设计**：完美适配桌面端与移动端浏览器。

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


## 🛠️ 技术栈

-   **核心框架**：React 19 (TypeScript)
-   **构建工具**：Vite 6
-   **样式处理**：Tailwind CSS 4
-   **状态管理**：React Hooks
-   **同步方案**：WebDAV HTTP Client

## 💾 数据存储与同步

### 1. 本地存储
应用将所有数据存储在用户的浏览器本地，主要字段如下：

| Key | 说明 |
| :--- | :--- |
| `taoism_partitions_{id}` | 书籍章节的分卷/分组配置 |
| `taoism_interpretations_{id}` | 对应书籍的用户个人批注与心得 |
| `taoism_ai_settings` | AI 助手配置（Endpoint、Model、API Key 等） |
| `taoism_webdav_config` | WebDAV 连接配置 |
| `taoism_dirty_since` | 脏数据标记，记录上次修改时间，用于触发同步提示 |
| `taoism_local_last_write` | 上次本地写入时间戳，用于冲突检测 |
| `taoism_remote_last_sync` | 上次成功同步时的远端时间戳，用于冲突检测 |

### 2. 同步逻辑
应用在数据发生变化时，会标记本地状态为“脏”，并在界面上提醒用户当前有未同步的修改。如果配置了 WebDav，用户可以手动备份和恢复数据，备份和恢复后都会删除本地脏标记。此外亦支持一键同步，一键同步的逻辑为：
*   1. 当本地没有脏标记，则执行下载。
*   2. 当本地存在脏标记，则比较本地上次远程同步时间到最后一次修改之间远端服务器是否有变更。
    *   2.1 若无变更，则上传本地数据并删除脏标记。
    *   2.2 若有变更，则逐书逐章比较内容。
        *   2.2.1 若无冲突，则上传本地数据并删除脏标记。
        *   2.2.2 若有冲突，则弹出对话框告知用户，取得允许后保留双方数据并上传下载，随后删除脏标记。

## 📝 文本声明

本应用使用的《老子》原文主要参考自王弼本，并结合帛书本、竹简本等进行了部分校勘；《庄子》原文主要参考自郭象本，二者均经过了重新校对与标点整理。

内置的典籍原文属于公有领域。本应用本身的界面设计、交互逻辑及提供的工具代码受版权保护。

---

**Powered by Gemini with Google AI Studio**