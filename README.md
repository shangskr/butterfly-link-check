# Butterfly Link Check

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js)](https://nodejs.org)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![GitHub stars](https://img.shields.io/github/stars/shangskr/butterfly-link-check?style=social)](https://github.com/shangskr/butterfly-link-check)

Butterfly 主题友链自动检测和管理工具。支持在线编辑友链数据、拖拽排序、自动检测可访问性，生成的 JSON 可直接用于 Butterfly 主题友链页面。

## 功能

- **友链管理** — 在线编辑 `link.yml`，添加、修改、删除友链
- **自动检测** — GitHub Actions 三阶段检测友链可访问性（直接检测 + 第三方 API + Cloudflare Worker）
- **拖拽排序** — 可视化拖拽调整友链顺序，支持跨分类移动
- **响应式设计** — 桌面端侧边栏 + 移动端下拉导航
- **深色模式** — 全局明暗主题切换，`localStorage` 持久化
- **JWT 认证** — 用户名 + 密码登录，Token 鉴权，密码不暴露前端

## 项目结构

```
pages/
├── index.js          # 项目首页
├── admin.js          # 管理后台（登录 + 文件编辑 + 排序 + 检测状态）
├── _app.js           # 全局 Provider
└── api/
    ├── login.js      # POST - 用户名密码登录，返回 JWT
    ├── verify.js     # GET  - 验证 Token 有效性
    ├── files.js      # GET  - 返回可编辑文件列表
    └── file.js       # GET/PUT - 读取/提交文件到 GitHub

components/
├── AuthProvider.js   #（login / logout / verify）
├── ThemeProvider.js  #（深色模式切换 + localStorage）
├── LoginForm.js      # 登录表单
├── DashboardLayout.js# 后台布局
├── Sidebar.js        # 文件列表侧边栏
├── FileEditor.js     # 文本编辑器 + 搜索
├── LinkSorter.js     # 可视化拖拽排序
├── LinkDashboard.js  # 友链检测状态看板
└── ConfirmModal.js   # 弹窗

lib/
├── auth.js           # JWT 签名/验证
└── github.js         # GitHub Contents API

styles/
└── globals.css       # 全局样式

check.py              # 友链检测脚本
link.yml              # 友链数据文件
manual_check.json     # 手动覆盖检测状态
cf-workers            # Cloudflare Worker 代码
```

## 快速开始

### 1. Fork 并部署

Fork 本项目，在 Vercel 中导入并设置以下环境变量。

### 2. 环境变量（Vercel）

| 变量 | 必填 | 说明 |
|------|------|------|
| `AUTH_USERNAME` | 是 | 管理员用户名 |
| `AUTH_PASSWORD` | 是 | 管理员密码 |
| `JWT_SECRET` | 是 | JWT 签名密钥，使用随机字符串 |
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token（`repo` 权限） |
| `GITHUB_REPO` | 是 | 仓库名，格式 `username/repo` |
| `FILE_1_PATH` | 否 | `link.yml` 路径（默认 `link.yml`） |
| `FILE_2_PATH` | 否 | `manual_check.json` 路径（默认 `manual_check.json`） |
### 3. GitHub Secrets（Settings → Secrets and variables → Actions → Repository secrets）

| 名称 | 必填 | 说明 |
|------|------|------|
| `PAT_TOKEN` | 是 | 用于 CI 提交结果的 Personal Access Token（`repo` 权限） |
| `CF_WORKER_URL` | 否 | Cloudflare Worker 地址（不填则跳过该检测阶段） |

### 4. 集成 Butterfly

部署完成后，将 `https://你的域名/check_links.json` 填入 Butterfly 主题的友链设置页面。

## 本地开发

```bash
cp .env.example .env.local   # 填写环境变量
npm install
npm run dev                  # http://localhost:3000
```
