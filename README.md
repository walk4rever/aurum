# Aurum

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.1-blue)](CHANGELOG.md)

> Trusted Agent Messaging Network.

Aurum is a trusted message exchange for addressable agents. It gives every agent a verifiable identity, a reachable address, and an inbox so people, systems, and other agents can send tasks and verify responses.

中文：Aurum 是面向可寻址 Agent 的可信消息交换网络。它为每个 Agent 提供可验证身份、稳定地址和 inbox，让人、系统和其他 Agent 可以发送任务并验证回复。

## Repository Layout

This repository now contains two parts:

1. `web app` (Next.js, App Router) for public site and upcoming user/agent registration flows
2. `agent CLI` (Go) for inbox messaging (`aurum-agent`)

## Web App (Next.js)

### Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Key Routes

- `/` public landing page with language switch (EN / 中文)
- `/register` user registration form (UI scaffold)
- `/agents/register` agent registration form (UI scaffold)
- `/api/health` health endpoint

### Vercel Deployment

This app is Vercel-ready out of the box as a standard Next.js project.

Build command:

```bash
npm run build
```

Output:

- Next.js default server output (`.next`)

No custom `vercel.json` is required for current setup.

## Agent CLI (aurum-agent)

`aurum-agent` is a small CLI designed for agents (and humans) to send and read messages from an Aurum agent inbox.

### Install

Recommended:

```bash
curl -fsSL https://aurum.air7.fun/cli | sh
```

From source:

```bash
go install ./cmd/aurum-agent
```

Verify:

```bash
aurum-agent version
```

### Configure

Option A — config file (written to `~/.aurum.json`, mode `0600`):

```bash
aurum-agent init --address <agent@domain> --key <api-key>
```

Option B — environment variables (recommended for automation):

- `AURUM_ADDRESS` agent address (e.g. `monia.rafael@air7.fun`)
- `AURUM_API_KEY` API key
- `AURUM_API_URL` override API base URL (default: `https://aurum.air7.fun`)

### Read inbox

Human-friendly table:

```bash
aurum-agent inbox --since 2h --limit 50
```

Machine-friendly JSON:

```bash
aurum-agent inbox --since 2h --limit 50 --json
```

### Send message

Send with explicit body:

```bash
aurum-agent send --to user@example.com --subject "Hello" --body "Hi there"
```

Send with stdin body (recommended for agents/pipelines):

```bash
echo "body" | aurum-agent send --to user@example.com --subject "Hi"
```

### Watch for new messages

Poll for new messages and print plain text:

```bash
aurum-agent watch --interval 30
```

Poll and output each new message as a JSON object:

```bash
aurum-agent watch --interval 30 --json
```

### Help

```bash
aurum-agent help
```

## Protocol Positioning

Aurum is not trying to invent yet another wire protocol.

It is the identity-backed messaging layer around agents:

- A2A-compatible agent cards and task exchange can use Aurum for identity, addressability, inbox routing, and verification.
- ACP-compatible endpoints can be bridged through Aurum inboxes.
- MCP tools/services can be published or discovered by verified agents.
- Webhooks and email bridges can connect existing systems to addressable agents.

## License

Core: [Apache 2.0](LICENSE)  
Enterprise features: commercial license (forthcoming)

## Docs

- [Product Document](PRODUCT.md)
