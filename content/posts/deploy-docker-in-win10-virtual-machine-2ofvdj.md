---
title: 在win10虚拟机中部署docker
category: "Docker"
slug: deploy-docker-in-win10-virtual-machine-2ofvdj
date: '2025-04-19 00:00:00+08:00'
lastmod: '2026-04-14 23:39:06+08:00'
toc: true
isCJKLanguage: true
---

# 在win10虚拟机中部署docker

## 概述

　　这里我主要碰到了下面几个坑：

1. Vmware嵌套虚拟化
2. WSL版本问题
3. docker安装问题

## Vmware嵌套虚拟化

　　这个嵌套虚拟化指的是开启VMware的中的Intel VT-x/EPT或AMD-V/RVI

![image-20250420090253354](/images/image-20250420090253354-20250705113328-3dk4bfs.png)

　　为了开启这个选项，我们需要关闭windows的一些安全机制，

- 内存完整性

![image-20250420090425002](/images/image-20250420090425002-20250705113328-sno3lll.png)

- 基于虚拟化的安全性

  https://www.microsoft.com/en-us/download/details.aspx?id=53337

  去微软官网下载DeviceGuard控制脚本，输入

  ```
  .\DG_Readiness_Tool_v3.6.ps1 -Disable
  ```

  然后在msfinfo32中检查情况

  ![image-20250420090723557](/images/image-20250420090723557-20250705113328-98eg1m1.png)

  确保是未启用的。

  ## WSL版本问题

  这里就需要我们去下载两个东西，一个是更新wsl内核，一个用来更新wsl命令。

  内核更新按照微软文档步骤走就行，连接如下

  https://learn.microsoft.com/zh-cn/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package

  更新wsl命令则直接去wsl的github仓库下载最新版wsl，安装即可

  https://github.com/microsoft/WSL/releases/tag/2.4.13

## docker安装问题

　　这里其实也是wsl版本问题，按照文档走即可

　　https://docs.docker.com/desktop/features/wsl/
