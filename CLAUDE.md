# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Windows XP Luna 主题风格的复古博客网站，包含 3D 开场动画和交互式 XP 桌面体验。

设计规格书: `docs/superpowers/specs/2026-04-12-blog-design.md`

## 技术栈

- **静态站点生成器**: Hugo (Page Bundle 内容组织)
- **前端**: 纯 HTML/CSS/JavaScript + Three.js (3D 动画)
- **部署**: GitHub Actions → GitHub Pages

## 目录结构

```
/                          # Hugo 根目录
├── content/              # 内容 (Page Bundle)
│   ├── posts/            # 博客文章
│   │   └── [slug]/
│   │       └── index.md
│   └── about/
│       └── index.md
├── layouts/              # Hugo 模板
├── static/               # 静态资源
│   ├── css/              # 样式
│   ├── js/               # JavaScript
│   │   ├── desktop.js    # 桌面交互
│   │   ├── markdown.js   # Markdown 渲染
│   │   └── three/        # Three.js
│   └── models/           # 3D 模型
├── themes/               # Hugo 主题
├── config.toml           # Hugo 配置
└── .github/workflows/    # GitHub Actions
```

## 常用命令

```bash
# 本地开发
hugo server -D              # 启动 Hugo 本地服务器
hugo --gc --minify         # 生产构建

# GitHub Actions 本地测试 (需要 act)
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:runner
```

## 核心功能模块

### 1. 3D 开场动画 (static/js/three/)
- Three.js 渲染复古 LCD 显示器
- 蒸汽波风格背景 + 网格线
- 3秒动画后自动进入桌面

### 2. 桌面系统 (static/js/desktop.js)
- XP Luna 主题 UI
- 文件夹图标 (about me, post, category)
- 任务栏 (开始按钮、窗口按钮、系统托盘)

### 3. 文件浏览器窗口
- 双击打开文件夹
- 地址栏支持 URI 导航
- 左上角: 前进/返回按钮
- 右上角: 关闭按钮

### 4. Markdown 渲染 (static/js/markdown.js)
- marked.js 渲染 Markdown
- highlight.js 代码高亮
- 图片灯箱效果

## 内容管理

Hugo Page Bundle 结构，每篇文章一个文件夹：

```yaml
---
title: "文章标题"
date: 2024-01-01
category: "分类名"
---
正文内容...
```

分类从 frontmatter 的 `category` 字段读取并聚合。

## 部署流程

GitHub Actions 自动部署到 GitHub Pages：
1. 推送至 `main` 分支
2. 构建 `hugo --gc --minify`
3. 部署至 `gh-pages` 分支
