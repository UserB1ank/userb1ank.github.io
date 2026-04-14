---
title: MCP-Kali-Server AI自动渗透
slug: mcpkaliserver-ai-automatic-penetration-1w7h2s
url: /post/mcpkaliserver-ai-automatic-penetration-1w7h2s.html
date: '2026-03-11 10:55:15+08:00'
lastmod: '2026-04-14 23:26:42+08:00'
toc: true
isCJKLanguage: true
---



# MCP-Kali-Server AI自动渗透

# 简介

　　众所周知，随着claude、openclaw等agent产品的问世，以及codingplan这一套餐使得大多数人可以用到廉价的大模型token，各种各样的大模型衍生产物开始出现，**[MCP-Kali-Server](https://github.com/Wh0am123/MCP-Kali-Server)**就是其中之一。

　　该项目利用MCP为LLM提供了大量kali工具的调用接口，使得大模型具备一定的渗透测试能力。

![image](assets/image-20260311105849-okzkg6t.png)

　　虽然预制的tool接口数量较少，但是提供了在kali机器上执行命令的接口，这使得kali上所有工具都可以被调用。

# 部署方式

## kali端

　　一台kali，

```bash
sudo apt update
sudo apt install mcp-kali-server
```

![image](assets/image-20260311111333-viritve.png)

　　启动服务，监听端口5000，可以通过--port参数修改端口

```bash
kali-server-mcp --ip 0.0.0.0
```

# 客户端

## 安装配置claudecode

```bash
sudo npm install -g @anthropic-ai/claude-code
```

　　配置第三方大模型API

```bash
vim ~/.claude/settings.json
```

　　输入内容

```bash
{    
    "env": {
        "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
        "ANTHROPIC_BASE_URL": "https://xxx/apps/anthropic",
        "ANTHROPIC_MODEL": "glm-5"
    }
}
```

　　如果你比较在意隐私，claude也提供了关闭遥测等[数据收集](https://code.claude.com/docs/zh-CN/data-usage)功能的参数。

```bash
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://xxx/apps/anthropic",
    "ANTHROPIC_MODEL": "glm-5"
    "DISABLE_BUG_COMMAND":1,
    "DISABLE_TELEMETRY":1,
    "DISABLE_ERROR_REPORTING":1,
    "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY":1
  }
}
```

## 配置MCP-Kali-Server

　　我们这里还需要配置MCP的客户端

```bash
git clone https://github.com/Wh0am123/MCP-Kali-Server.git
```

　　新建python虚拟环境，并安装相关运行库

```bash
cd /opt/MCP-Kali-Server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements
```

## 配置MCP Server

　　新建一个目录用于claudecode工作

```bash
mkdir kali-mcp
```

　　进入该目录后，为claude添加mcp服务，

```bash
claude mcp add mcp-kali-server \
/opt/MCP-Kali-Server/venv/bin/python3 \
/opt/MCP-Kali-Server/client.py \
-- \
--server http://<kali的ip>:5000/
```

　　然后打开claude，输入`/mcp`就会发现mcp服务已经被检测到了

![image](assets/image-20260311112712-49ssmif.png)

![image](assets/image-20260311112731-guf6sf8.png)

# 使用

　　打开claude后，直接输入要求，让claude帮你做事。

![image](assets/image-20260311113306-eme20fe.png)

　　本图中的例子是hackthebox的靶场，如果你不希望ai把东西乱存，你就要给他明确的工作目录。根据本人之前的使用情况，ai很容易就采用爆破这种手段，但是在CTF/靶场环境下，一般都不是爆破，那么就需要给他明确的提示词。

# 缺陷

　　最大的缺陷就是大模型自身的能力，模型好则效果好，模型差则效果差。

　　还有一个问题就是，渗透测试过程中，有些场景是需要交互式的操作的，MCP暂时应该没有办法提供这种能力。
