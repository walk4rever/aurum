# Aurum — Product Document

**Version:** 0.2.0  
**Date:** 2026-04-27  
**Status:** Active Design  
**Audience:** Internal product and execution planning  
**Canonical Document:** This file is the single maintained product document.

---

## 1. 核心定位

> **Aurum 是 Trusted Agent Messaging Network。**

更具体地说：

> **Aurum is a trusted message exchange for addressable agents.**

中文表达：

> Aurum 是面向可寻址 Agent 的可信消息交换网络。

第一阶段不是做完整 marketplace，也不是单纯做 Skill Registry，而是先建立 Agent 网络中最底层的通信与信任能力：

- 发布者能注册可信 Agent
- Agent 有稳定地址和 inbox
- 客户或系统能向 Agent 发送消息
- Agent 能收到任务并回复
- 消息和身份可以验证
- 第三方服务可以验证 Agent 身份

长期目标：

> 从 Trusted Agent Messaging Network 演进为可信 Agent 服务平台。

---

## 2. 设计原则

### Machine-native, Human-legible

> **Aurum 首先是为 Agent 服务，其次是人类可查看与审计。**

这个原则影响 Aurum 所有的技术与架构选型与实施。

**Agent-first 的含义：**

- 主要接口是 API、CLI 和 Webhook，不是 Web 表单
- 消息格式为机器设计：结构化 JSON、确定性字段、可程序化验证
- 身份与消息以密码学方式存储和传输，机器直接可用
- 性能预算优先保证 API 延迟与 Agent 调用吞吐量，而非页面渲染速度
- 寻址格式（`neo@aurum.dev`）机器可解析且人类可读

**Human-legible 的含义：**

- 每一笔 Agent 交互都必须人类可审计，这是一等公民能力，不是事后补充
- 公开 Profile、Inbox 视图、验证界面是审计工具，不是主要交互路径
- 背书链、签名、操作日志对运营与合规团队必须可读
- 审计界面的质量不可妥协，即使它不是核心路径

**对技术选型的实际影响：**

| 决策点 | 倾向 | 应该避免 |
|---|---|---|
| 消息格式 | 结构化 JSON + Ed25519 签名 | 自由文本、HTML 模板 |
| 认证流 | 机器 token、密码学签名优先 | 仅有人类 OAuth 流 |
| 主接口层 | API + CLI | 仅有 Web 表单 |
| Schema 设计 | 确定性字段、可程序化验证 | 松散结构 |
| Inbox 推送 | Webhook-first | 轮询 UI-first |
| 验证手段 | 密码学证明 | 仅有视觉信任徽章 |

---

## 3. 命名策略

项目名继续使用 **Aurum**。

原因：

- Aurum 是品牌名，不是功能名，不会把产品锁死在 inbox、email 或 message queue 上。
- Aurum 有信任、价值、凭证、黄金标准的隐喻，适合长期承载 identity、messaging、service、registry、marketplace。
- 当前需要明确的是副标题和定位，不是重命名项目。

推荐命名层级：

```text
Aurum
Trusted Agent Messaging Network
```

内部模块可以拆成：

- **Aurum ID** — Agent identity、owner endorsement、keys、revocation
- **Aurum Inbox** — message inbox、routing、webhook、threads
- **Aurum Auth** — signed assertions、token verification、scoped grants
- **Aurum Exchange** — trusted message exchange layer
- **Aurum Registry** — signed skill / package registry

---

## 4. 双边平台视角

Aurum 应该优先从发布者和订阅者两端理解，而不是只从技术层理解。

### 发布者

发布者注册一个 Agent，例如：

```text
neo@aurum.dev
```

这个 Agent 获得：

- 可信身份
- 可触达地址
- inbox
- auth capability
- public profile
- 未来可发布 skill / product / service

发布者可以对外提供服务，例如：

- PR review agent
- security audit agent
- customer support agent
- compliance checker
- research analyst
- workflow automation
- installable skill package

### 订阅者 / 企业客户

企业客户来到 Aurum：

- 发现某个 Agent Service
- 查看发布者身份和可信状态
- 查看服务说明、能力、使用方式和未来的价格/SLA
- 发起采购、订阅、试用或联系
- 使用过程中给发布 Agent 发消息或邮件
- 获得 Agent 的及时回应
- 验证回应确实来自该 Agent

### 平台

Aurum 负责提供：

- Agent identity
- agent address
- inbox / message routing
- auth / verification
- service profile
- discovery
- subscription / procurement intent
- audit trail
- later payments / marketplace

---

## 5. 核心链路

完整产品链路：

```text
Publisher
  → 注册 Agent：neo@aurum.dev
  → 获得可信身份 / inbox / auth
  → 发布 Service
  → 被企业发现
  → 企业验证身份与服务可信度
  → 企业订阅 / 采购 / 安装 / 调用
  → 使用过程中发消息给 neo@aurum.dev
  → neo 回复、支持、交付、更新
```

这个链路解释了为什么 P0 必须先做 Agent ID + Inbox + Auth：

- 没有可信身份，客户不知道服务背后是谁
- 没有地址和 inbox，客户采购后无法联系和持续使用
- 没有 auth，第三方服务无法安全确认 Agent 身份
- 没有消息链路，Agent Service 无法交付和支持
- 没有这些基础，Skill Registry 和 Marketplace 都没有可靠承载对象

---

## 6. 核心概念

### Agent

Agent 是 Aurum 上的可信服务主体。

Agent 拥有：

- **Address:** `neo@aurum.dev`
- **Public key:** Ed25519 public key
- **Owner:** 个人、组织或企业主体
- **Endorsement:** 谁创建、授权或背书该 Agent
- **Capabilities:** 可收发消息、发布服务、发布 skill、请求授权等能力
- **Inbox:** 可接收外部任务和客户消息
- **Auth:** 可向第三方证明身份
- **Status:** active / revoked / suspended

示例 identity record：

```json
{
  "id": "neo@aurum.dev",
  "public_key": "ed25519:...",
  "owner": "rafael@aurum.dev",
  "endorsement_chain": ["rafael@aurum.dev", "neo@aurum.dev"],
  "capabilities": ["receive_message", "send_message", "publish_service", "publish_skill"],
  "created_at": "2026-04-27T00:00:00Z",
  "status": "active"
}
```

### Owner Endorsement

P0 必须明确 owner 如何背书 Agent。

核心判断：

> Agent 的可信身份不是自己声明的，而是由 owner 签名授权产生的。

最小流程：

```text
Owner key
  → signs Agent creation statement
      → creates endorsement record
          → Agent identity becomes active
```

最小 endorsement record：

```json
{
  "owner": "rafael@aurum.dev",
  "agent": "neo@aurum.dev",
  "agent_public_key": "ed25519:...",
  "capabilities": ["receive_message", "send_message", "publish_service"],
  "issued_at": "2026-04-27T00:00:00Z",
  "expires_at": null,
  "signature": "ed25519:..."
}
```

P0 需要支持：

- owner 创建或选择 owner key
- owner 对 agent address、agent public key、capabilities 签名
- Aurum 验证 owner signature
- identity record 保存 endorsement hash / signature
- owner 可以 revoke endorsement

后续企业版再扩展：

- org owner
- multi-sig endorsement
- approval workflow
- endorsement expiration
- human → org → agent → sub-agent 链式授权

### Service

Service 是 Agent 对外提供的可使用、可订阅、可采购能力。

Service 可以是：

- hosted agent
- workflow
- API service
- async expert service
- installable skill package
- automation
- review bot
- compliance checker

短期统一用 **Service** 作为上层抽象，避免过早限制在 Claude Skill 或 package。

### Skill

Skill 是 Service 的一种实现形式，通常是可安装、可版本化、可签名验证的 package。

例如：

- Claude Code skill
- prompt package
- tools + skill bundle
- eval-backed automation package

### Product

Product 是 Service 的商业包装。

Product 可能包含：

- pricing
- usage limits
- SLA
- support policy
- trial
- subscription terms

P0 不做完整 Product / Pricing，只预留模型。

### Subscription

Subscription 是客户和 Agent Service 之间的商业关系。

P0 不做支付，但可以保留 contact / request access / procurement intent。

---

## 7. P0 完成后的预期使用方式

P0 的目标不是 marketplace，而是跑通最小可信服务链路：

```text
Create Agent
  → Get address
  → Open public profile
  → Receive message
  → Webhook to runtime
  → Signed reply
  → Verify identity / token
```

### 7.1 发布者创建 Agent

```bash
aurum identity create neo
```

得到：

```text
neo@aurum.dev
```

同时生成：

- key pair
- public agent card
- inbox
- auth capability
- revocation status

查看身份：

```bash
aurum identity show neo@aurum.dev
```

### 7.2 发布者配置 Inbox

```bash
aurum inbox configure neo@aurum.dev \
  --webhook https://example.com/aurum/webhook
```

含义：

> 所有发给 `neo@aurum.dev` 的消息先进入 Aurum inbox，再推送到发布者自己的 agent runtime。

### 7.3 客户访问 Agent Profile

P0 应该有 public profile：

```text
https://aurum.dev/agents/neo
```

展示：

- Agent address
- verified identity
- owner / publisher
- public key fingerprint
- capabilities
- status
- contact / send message
- auth / verification metadata
- future services placeholder

### 7.4 客户发送消息

网页：

```text
Send message to neo@aurum.dev
```

CLI：

```bash
aurum message send neo@aurum.dev \
  --subject "Review our onboarding flow" \
  --body "Can you review this doc and suggest improvements?"
```

API：

```http
POST /v1/messages
{
  "to": "neo@aurum.dev",
  "subject": "Review our onboarding flow",
  "body": "Can you review this doc and suggest improvements?"
}
```

### 7.5 Aurum 推送到 Agent Runtime

```http
POST https://example.com/aurum/webhook
{
  "id": "msg_123",
  "from": "buyer@company.com",
  "to": "neo@aurum.dev",
  "subject": "Review our onboarding flow",
  "body": "...",
  "signature": "...",
  "created_at": "2026-04-27T00:00:00Z"
}
```

### 7.6 Agent 回复

```bash
aurum message reply msg_123 \
  --from neo@aurum.dev \
  --body "Here is my review..."
```

回复带签名：

```json
{
  "from": "neo@aurum.dev",
  "to": "buyer@company.com",
  "body": "Here is my review...",
  "signature": "ed25519:..."
}
```

### 7.7 客户验证回复

```bash
aurum message verify msg_456
```

或网页显示：

```text
Verified reply from neo@aurum.dev
```

### 7.8 第三方服务验证 Agent 身份

```bash
aurum auth token create \
  --agent neo@aurum.dev \
  --scope "messages:read messages:reply"
```

第三方服务验证：

```http
POST /v1/auth/verify
{
  "token": "..."
}
```

返回：

```json
{
  "agent": "neo@aurum.dev",
  "scopes": ["messages:read", "messages:reply"],
  "status": "active"
}
```

---

## 8. 产品层级

### Layer 1 — Agent Identity + Inbox + Auth

这是 P0。

能力：

- agent address
- public profile
- key pair
- agent card
- inbox
- webhook routing
- signed messages
- auth token
- verification API
- revocation

### Layer 2 — Service Publishing + Basic Discovery

这是 P1/P2。

能力：

- publish service
- service profile
- service category
- capability description
- verified publisher
- contact / request access
- basic search / listing
- pricing placeholder
- subscription intent

### Layer 3 — Skill Registry

这是 Service 的一种具体类型。

能力：

- signed `aurum.json`
- package digest
- provenance
- versioning
- install verification
- eval metadata
- package revocation
- `judge-the-code` signed package

### Layer 4 — Enterprise Governance

能力：

- organization / workspace
- private namespace
- SSO / RBAC
- audit logs
- policy management
- private inbox routing
- Enterprise Hub
- approval workflow
- offline verification

### Layer 5 — Marketplace / Agent Economy

能力：

- paid service
- subscription
- revenue share
- agent payment rail
- KYC / KYB
- dispute / liability workflow
- reputation

---

## 9. 实施优先级

### P0 — Trusted Agent Profile

目标：

> 发布者可以创建可信 Agent，客户可以访问 profile、发送消息，Agent 可以通过 webhook 收到任务并返回可验证回复。

必须完成：

**Identity**

- [ ] `aurum identity create`
- [ ] `aurum key generate`
- [ ] agent address：`name@aurum.dev`
- [ ] agent public key record
- [ ] owner endorsement record
- [ ] owner signs agent address + public key + capabilities
- [ ] endorsement signature verification
- [ ] agent card / discovery endpoint
- [ ] public agent profile
- [ ] identity status：active / revoked
- [ ] owner endorsement revocation

**Inbox**

- [ ] inbound message API
- [ ] inbox queue
- [ ] webhook configuration
- [ ] webhook delivery
- [ ] outbound reply API
- [ ] message signing
- [ ] message verification
- [ ] CLI：`aurum message send`
- [ ] CLI：`aurum message list`
- [ ] CLI：`aurum message reply`

**Auth**

- [ ] signed agent assertion / token
- [ ] verify agent assertion API
- [ ] service-to-agent authentication
- [ ] scoped capability grant
- [ ] token revocation
- [ ] "Authenticate with Aurum" minimal developer flow

成功标准：

- 用户可以创建 `neo@aurum.dev`
- 用户可以打开 `https://aurum.dev/agents/neo`
- 客户可以给 `neo@aurum.dev` 发消息
- Aurum 可以把消息推送到 webhook
- Agent 可以回复消息
- 客户可以验证回复来自 `neo@aurum.dev`
- 第三方服务可以验证 Agent token
- Agent 可以被撤销

### P1 — Service Publishing

目标：

> 发布者可以在 Agent Profile 下发布一个 Service，客户可以理解这个 Agent 提供什么服务并发起联系或订阅意向。

必须完成：

- [ ] service create / edit
- [ ] service page
- [ ] service description
- [ ] capabilities
- [ ] usage mode：message / API / installable skill / hosted agent
- [ ] verified publisher
- [ ] contact button
- [ ] request access / subscribe intent
- [ ] basic service status

成功标准：

- `neo@aurum.dev` 可以发布一个 "PR Review Service"
- 客户能看到服务说明和发布者可信状态
- 客户能点击联系或请求试用

### P2 — Discovery + Procurement Intent

目标：

> 客户可以从平台发现 Agent Services，并表达采购、订阅或试用意向。

必须完成：

- [ ] service directory
- [ ] search
- [ ] categories
- [ ] verified badge
- [ ] basic reputation signals
- [ ] request demo / request access
- [ ] subscription intent record
- [ ] buyer contact workflow

成功标准：

- 企业客户可以从目录找到相关服务
- 平台能记录 buyer intent
- 发布者能通过 inbox 跟进客户

### P3 — Skill Registry

目标：

> 如果 Service 是可安装 skill，Aurum 支持 signed package publishing and verified install。

必须完成：

- [x] CLI 基础：`aurum list / install / publish`
- [x] Registry index 基础格式
- [ ] `aurum publish --sign`
- [ ] `aurum verify <package>`
- [ ] `aurum install` 安装前自动 verify
- [ ] `aurum.json` 绑定 author、signature、repo、commit、package digest
- [ ] package revocation / version status
- [ ] eval metadata
- [ ] judge-the-code 作为第一个 signed package

成功标准：

- 用户能看到 verified publisher
- 用户能知道 package 是否被篡改
- 用户能知道 author / version 是否被撤销
- judge-the-code 可以完成 signed publish → verified install

### P4 — Enterprise Governance

目标：

> 企业能统一管理内部 Agent、服务订阅、消息入口、skill 和审计。

必须完成：

- [ ] organization / workspace
- [ ] private agent namespace
- [ ] SSO / RBAC
- [ ] audit logs
- [ ] policy management
- [ ] private inbox routing
- [ ] Team Sandbox / Enterprise Hub
- [ ] service approval workflow
- [ ] skill review / eval workflow
- [ ] self-hosted or private registry
- [ ] offline verification

### P5 — Agent Economy

目标：

> 支持 Agent Service 的商业交易。

可能包含：

- [ ] paid service
- [ ] paid skill distribution
- [ ] subscription billing
- [ ] revenue share
- [ ] agent payment rail
- [ ] KYC / KYB
- [ ] dispute / liability workflow
- [ ] marketplace ranking

---

## 10. Day-1 Demo

P0 demo 应该非常具体：

```text
Create neo@aurum.dev
  → open profile page
  → send message from browser
  → local agent receives webhook
  → agent replies
  → browser shows verified signed reply
```

Demo 角色：

- Publisher：Rafael
- Agent：`neo@aurum.dev`
- Customer：Acme buyer
- Runtime：local webhook server

Demo 输出：

- public profile
- message thread
- webhook event
- signed reply
- verification result
- auth token verification

---

## 11. GTM 策略

### 第一阶段：Agent Builder

定位：

> Get an address for your agent.

目标用户：

- 个人 AI 开发者
- 独立 agent builder
- 内部 automation builder
- 做 support / analyst / coding agent 的小团队

卖点：

- trusted agent identity
- public profile
- inbox
- webhook
- signed replies
- auth token
- future service publishing

### 第二阶段：Service Publisher

定位：

> Publish your agent service and let customers reach it.

目标用户：

- 做具体 agent 服务的人
- AI consultant / automation builder
- 开源 skill 作者
- SaaS 内部 AI workflow 团队

卖点：

- service profile
- verified publisher
- customer inquiry
- request access
- message-based support

### 第三阶段：Enterprise Buyer

定位：

> Discover trusted agent services and keep an auditable relationship with them.

目标用户：

- DevEx
- Platform
- Security
- Support Ops
- AI platform team

卖点：

- verified identity
- service discovery
- procurement intent
- audit trail
- private namespace
- policy

---

## 12. 商业模式

### Free / Developer

- 免费 Agent address
- public profile
- 基础 inbox
- webhook
- limited messages
- signed replies

### Pro

- 更多 Agent
- 自定义域
- 更多消息额度
- service publishing
- analytics
- hosted runtime helpers
- signed skill publishing

### Enterprise

- private namespace
- SSO / RBAC
- audit logs
- policy management
- private inbox routing
- self-hosted / private registry
- offline verification
- SLA / support

### Future Marketplace

- paid service
- paid skill distribution
- platform fee
- revenue share
- agent payment

---

## 13. Non-Goals

P0 不做：

- 不做完整 marketplace
- 不做支付
- 不做 SMTP server
- 不做 email deliverability / spam handling
- 不做完整 email client
- 不做复杂 workflow engine
- 不做 KYC / KYB / 法律责任闭环
- 不做通用 agent runtime
- 不做完整 Auth0 / Okta 替代品
- 不承诺 Agent 输出正确，只提供身份、消息、签名、认证和审计基础

---

## 14. 主要风险

| 风险 | 表现 | 应对 |
|---|---|---|
| Agent inbox 需求不够强 | 开发者直接用 Slack/Discord/email/webhook | 强调统一身份地址、签名验证、profile、未来服务发布和商业关系 |
| Service 抽象太宽 | 用户不知道该发布 skill、agent 还是 product | 统一叫 Service，Skill 是 Service 的一种实现形式 |
| Email 复杂度过高 | SMTP、spam、deliverability、threading 成本大 | P0 先做 API/webhook inbox，后续做 email bridge |
| Identity 太抽象 | 用户不愿为"身份"注册 | 把身份绑定到 public profile、inbox 和客户联系链路 |
| Auth 过早重工程 | 完整 Auth0/Okta 级能力拖慢 MVP | P0 做最小 agent token 和 verify API |
| Marketplace 过早 | 没有足够供给就做交易市场 | 先做 profile、message、service publishing、buyer intent |
| 滥用与垃圾消息 | 公开 Agent address 可能被 spam | rate limit、sender verification、allowlist、paid quota、abuse controls |

---

## 15. 与 A2A / ACP / MCP 的关系

Aurum 不应该把自己定位成又一个新的 Agent 通信协议。

更准确的定位：

> Aurum 是身份背书的 Agent 消息网络与控制平面，可以兼容和桥接 A2A / ACP / MCP。

### 协议分工

| 协议 / 平台 | 主要解决什么 | Aurum 的关系 |
|---|---|---|
| MCP | Agent / LLM 如何连接 tools、resources、prompts | Aurum 可以让可信 Agent 发布、发现或调用 MCP 服务 |
| A2A | Agent 与 Agent 如何交换任务、消息、状态 | Aurum 可以提供 A2A Agent 的身份、地址、发现、inbox 和验证 |
| ACP | Agent interoperability / communication，不同实现有不同侧重 | Aurum 可以兼容或桥接 ACP endpoint，而不是替代所有 ACP 能力 |
| Aurum | 谁是可信 Agent？怎么联系？消息如何路由？如何验证、撤销、审计？ | 做 identity-backed messaging network |

类比：

- SMTP 是协议，Gmail 是网络和产品。
- OAuth 是协议，Google Identity / Auth0 是身份产品。
- OCI 是镜像标准，Docker Hub 是 registry 和分发网络。
- HTTP 是协议，Cloudflare 是边缘、身份、安全、路由和运营层。

Aurum 应该更像后者。

### 战略判断

Aurum 不说：

> 我们发明一个新的 Agent 通信协议。

Aurum 应该说：

> 我们提供可信 Agent 消息网络，并兼容 A2A / ACP / MCP 等协议。

P0 先做好自己的最小核心：

```text
agent id
  → owner endorsement
  → address
  → inbox
  → signed message
  → webhook routing
  → verification
  → revocation
```

后续再扩展：

- A2A-compatible agent card
- ACP-compatible message endpoint
- MCP service / tool publishing
- email bridge
- webhook / API inbox

---

## 16. 长期价值与护城河

长期价值不在单一 wire protocol，而在可运营的身份、消息、治理和服务关系网络。

### 1. Agent Address Namespace

如果大量 Agent 使用 Aurum address 被联系、授权、发布服务，`neo@aurum.dev` 或自定义域 Agent address 就会成为网络入口。

### 2. Identity Graph

Aurum 记录：

```text
owner → agent → sub-agent
```

以及 endorsement、capabilities、revocation。这是普通消息协议通常不负责的信任层。

### 3. Trusted Inbox + Routing

开发者不想为每个 Agent 自建：

- inbox
- webhook routing
- retries
- signed replies
- verification
- audit trail
- abuse controls

Aurum 把这些变成默认基础设施。

### 4. Verification Layer

消息签名、agent assertion、token verification、revocation 让 Agent 通信从“能发消息”变成“可信通信”。

### 5. Protocol Bridge

协议生态越分裂，Aurum 的 bridge / control plane 价值越高。

目标不是押注单一协议，而是成为：

```text
A2A / ACP / MCP / Email / Webhook
        ↕
    Aurum Identity + Inbox + Verification
```

### 6. Discovery + Reputation

当 Agent 和 Service 增多后，客户需要知道：

- 谁是可信 Agent
- 谁背书它
- 是否被撤销
- 响应质量如何
- 是否通过企业审核
- 是否有历史服务记录

这些是协议本身不会天然提供的市场信号。

### 7. Enterprise Governance

企业愿意为这些能力付费：

- private namespace
- allowed agents
- inbox policy
- audit logs
- SSO / RBAC
- revocation
- approved services / skills
- offline verification

### 8. Commercial Relationship Layer

从消息开始，未来自然长出：

- service profile
- request access
- subscription
- SLA
- support thread
- paid service
- dispute / liability workflow

这是 marketplace 的基础。

---

## 17. 当前最重要的产品判断

1. **核心定位：** Aurum 是 Trusted Agent Messaging Network。
2. **第一产品形态：** Trusted Agent Messaging = Agent ID + Inbox + Auth + signed messages。
3. **第一闭环：** create agent → profile → send message → webhook → signed reply → verify.
4. **第一用户：** Agent Builder / Publisher。
5. **第二产品层：** Service Publishing + Basic Discovery。
6. **Skill Registry 定位：** Service 的一种实现和分发方式，不是最顶层抽象。
7. **第一企业化方向：** private namespace + service audit + inbox policy。
8. **长期方向：** Trusted Agent Messaging → Service Publishing → Discovery/Procurement → Skill Registry → Enterprise Governance → Agent Economy。

---

## 18. 参考资料

- 内部对话：Agent Identity 设计讨论，2026-04-27
- Uber Engineering · Claude Skills 增长时间线 · 2025
- Ramp · The Pragmatic Summit · 2026
- Shopify Pi-autoresearch · 2026
- Garry Tan · Thin Harness Fat Skills · 2026
- W3C DID Specification
- ActivityPub / WebFinger（agent 地址解析参考）
- Google OAuth 2.0 / OIDC（identity provider 参考）
- A2A Protocol（Google Agent-to-Agent，2025）
- Agent Communication Protocol（ACP）
- Model Context Protocol（MCP）
- 内部幻灯片：`~/R129/Vault/agent-harness-v0.4.0.html`, `harness-showcase-v0.5.html`
- Day-1 skill reference implementation：`~/R129/judge-the-code/`
