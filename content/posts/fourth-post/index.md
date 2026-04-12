---
title: "GitHub Actions 自动化部署实战"
date: 2024-01-25
category: "技术"
---

# GitHub Actions 自动化部署实战

本文介绍如何使用 GitHub Actions 实现静态网站的自动化部署。

## 为什么需要 CI/CD？

- **自动化** - 推送代码后自动构建和部署
- **一致性** - 每次部署环境相同
- **快速反馈** - 及时发现构建问题

## 基本工作流

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3

      - run: hugo

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
```

## 部署到 GitHub Pages

1. 在仓库设置中启用 GitHub Pages
2. 选择 `gh-pages` 分支作为 source
3. 推送代码后等待部署完成

## 小技巧

- 使用 `concurrency` 避免重复部署
- 开启 `workflow_dispatch` 支持手动触发
- 利用 `submodules` 处理主题依赖

祝你部署愉快！
