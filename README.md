# 道经释义

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebDAV](https://img.shields.io/badge/WebDAV-Sync-0097A7)](https://webdav.org/) [![Zustand](https://img.shields.io/badge/Zustand-5-443E38?logo=zustand&logoColor=white)](https://github.com/pmndrs/zustand)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

一个沉浸式的道家典籍在线阅读平台，深度集成了 AI 会话助手，旨在通过现代科技辅助探索中国古代智慧。

## ✨ 特性

-   **📚 经典荟萃**：内置《老子》（道德经）、《庄子》、《列子》及《阴符经》的高质量校对文本。
-   **🤖 AI 深度解析**：支持通过 AI 模型对章节进行实时解读、答疑与哲学探讨。
-   **🎨 现代审美**：极简主义界面设计，支持平滑的章节切换动画与沉浸式阅读体验。
-   **⚙️ 灵活配置**：支持国内外主流模型与自定义 LLM 接入，满足不同用户的需求。
-   **💾 数据安全**：阅读进度与个人笔记存储于本地，支持导出备份。
-   **🔄 WebDAV 同步**：支持跨设备云端同步，可开启自动双向同步，具备智能冲突检测与手动处理提示。
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
-   **状态管理**：Zustand 5
-   **同步方案**：WebDAV HTTP Client

## 💾 数据存储与同步

### 1. 本地存储

应用使用 zustand 的 `persist` 中间件把所有需要持久化的状态**整体存入一个 localStorage 键**，避免分散读写带来的双写与一致性问题。

| Key | 说明 |
| :--- | :--- |
| `taoism_app_state` | 完整的应用持久化切片，内部字段见下表 |

`taoism_app_state` 中持久化的字段：

| 字段 | 说明 |
| :--- | :--- |
| `partitions` | 所有书籍的分卷/分组配置（按 bookId 索引） |
| `interpretations` | 所有书籍的用户个人批注与心得（按 bookId 索引） |
| `aiSettings` | AI 助手配置（Endpoint、Model、API Key 等） |
| `webdavConfig` | WebDAV 连接配置 |
| `autoSync` | 是否启用自动双向同步（默认关闭） |
| `dirtySince` | 脏数据标记，记录上次修改时间，用于触发同步提示与防抖自动同步 |
| `localLastWrite` | 上次本地写入时间戳，用于冲突检测 |
| `remoteLastSync` | 上次成功同步时的远端时间戳，用于冲突检测 |

运行时的 `syncState`（同步进行中状态与提示消息）通过 `partialize` 排除在持久化之外。

### 2. 同步逻辑
应用在数据发生变化时，会标记本地状态为"脏"，并在 Header 上通过**三态圆点指示器**提示当前同步状态（橘黄=有本地未同步变更、绿色=已同步、红色=需要手动处理）。如果配置了 WebDav，用户可以手动备份和恢复数据，备份和恢复后都会删除本地脏标记。得益于 zustand 的响应式订阅，WebDAV 下载 / 导入备份等操作会**实时刷新界面，无需刷新页面**。

#### 手动双向同步
WebDAV 手动双向同步的逻辑为：
*   1. 当本地没有脏标记，则执行下载。
*   2. 当本地存在脏标记，则比较本地上次远程同步时间到最后一次修改之间远端服务器是否有变更。
    *   2.1 若无变更，则上传本地数据并删除脏标记。
    *   2.2 若有变更，则逐书逐章比较内容。
        *   2.2.1 若无冲突，则上传本地数据并删除脏标记。
        *   2.2.2 若有冲突，则弹出对话框告知用户，取得允许后保留双方数据并上传下载，随后删除脏标记。

#### 自动双向同步
在 WebDAV 面板勾选「自动双向同步」后，[useAutoSync](src/hooks/useAutoSync.ts) 钩子会在以下时机**非交互式**地调用同步流程（共用上述同步逻辑）：

*   **启动延迟同步**：应用加载约 800ms 后执行首轮同步，便于拉取其他设备的最新变更。
*   **标签页可见性同步**：当浏览器标签从后台切回前台时自动同步。
*   **脏数据防抖同步**：本地发生变更后，经过 5s 静默期未再产生新改动时自动上传，避免连续输入期间的无效请求。

当自动同步检测到**无法安全合并的冲突**时，不会擅自覆盖数据，而是将 `syncState.status` 置为 `conflict`，由 Header 圆点变红提示用户手动打开 WebDAV 面板选择「上传覆盖远端」或「下载覆盖本地」。

## 📝 文本声明

本应用使用的《老子》原文主要参考自王弼本，并结合帛书本、竹简本等进行了部分校勘；《庄子》原文主要参考自郭象本，二者均经过了重新校对与标点整理。

内置的典籍原文属于公有领域。本应用本身的界面设计、交互逻辑及提供的工具代码受版权保护。

---

**Powered by Gemini with Google AI Studio & Qoder AI Native IDE**