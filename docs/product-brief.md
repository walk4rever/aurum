# Aurum — Product Brief

**Date:** 2026-04-25  
**Status:** Initial Concept

---

## 问题起源

来自三个企业案例的共同观察（见 agent-harness-v0.4.0 / harness-showcase-v0.5）：

- **Uber** — 5 个月从 2 个 skill 有机生长到 500+，建立了 Golden Marketplace（治理层） + Personal Sandbox（实验层）双轨机制。核心教训：这不是 AI 策略问题，是 Harness 架构问题。
- **Ramp** — "不要建一千个 Agent，要建一个 Agent + 一千种技能"。Omnihat 统一入口 + 内部工具目录，2600 万次决策，节省约 $2.9 亿。
- **Shopify Pi-autoresearch** — 定义指标 → 生成假设 → 二元淘汰，把优化变成持续自主循环。机械化评估是信任的基础。

**共同痛点：** 每家企业都要自己想出"Golden Marketplace"架构，而且往往想不到，或者想到了也没资源建。

---

## 产品定位

> **"企业 AI 知识的 GitHub"**

把 Uber 内部的 Golden Marketplace，作为 SaaS 提供给每家企业。

---

## 三层架构

```
Layer 3 — Industry Commons    跨企业公共技能库（行业通用 skill）
Layer 2 — Enterprise Hub      每家企业自己的 Golden Marketplace
Layer 1 — Team Sandbox        个人/团队的实验层
```

Uber 的核心教训："治理层和实验层必须分离"。Aurum 把这个设计变成每家企业的默认基础设施。

---

## 功能优先级

### P0 — 核心价值（没有这个就没有存在价值）

| 功能 | 说明 | 参考案例 |
|---|---|---|
| **Skill Registry** | 版本控制、依赖管理、元数据（作者/使用次数/eval score） | Uber Golden Marketplace |
| **Eval Pipeline** | 机械化评估框架。skill 必须绑定 eval 才能被信任和治理 | Shopify（构建时间数字化）/ Ramp（ground truth 标注） |
| **Promotion Workflow** | Team Sandbox → Enterprise Hub 的审核流（Code Review + CI + LLM-as-Judge） | Uber |

### P1 — 差异化护城河

| 功能 | 说明 |
|---|---|
| **Skill Composer** | 将多个 skill 组合成 workflow，实现 Ramp 的"1 Agent × N Skills"模式 |
| **ROI Dashboard** | 哪些 skill 被用了多少次、节省了多少时间 — 给 CTO 看的 ROI 数据 |
| **Auto Eval Generation** | 上传 skill + 3-5 个例子 → 系统生成 eval suite，降低 skill 发布门槛 |

### P2 — 生态扩展

- 跨企业的 Industry Commons（法律合规审查、财务报表分析等行业通用 skill）
- 第三方 ISV 发布 skill 的市场机制

---

## Day-1 Reference Implementation：judge-the-code

`~/R129/judge-the-code` 项目与 Aurum 的关系是三重的，不只是"一个可纳入的 skill"。

### 1. Industry Commons 的种子 skill bundle

judge-the-code 已经是一个 skill monorepo，结构正好是 Aurum 要托管的对象：

```
skills/
  code-explore/      ← 代码结构理解（Structure 层）
  design-lens/       ← 设计哲学审查（Taste 层）
  demon-hunter/      ← 安全漏洞 + CVE + 性能陷阱（Judgment 层）
  token-optimize/    ← LLM token 成本审计（Economy 层）
  skill-review/      ← Skill/Prompt 工程质量审查
tools/               ← Go binaries（确定性扫描，bearer/trivy/gitleaks）
```

5 个 skill 全部高频、跨行业，是 Commons 层第一批内容的自然选择。

### 2. `skill-review` 直接服务 Promotion Workflow

Uber 的 Golden Marketplace 里有"LLM-as-Judge"作为 skill 晋升审核步骤。`skill-review` 正是做这件事——审查 skill 的 prompt 清晰度、agent 编排、注入风险、模型可移植性。

**直接集成路径：** Team Sandbox → Enterprise Hub 的 Promotion Workflow 自动运行 `skill-review`，作为 CI 的内置关卡，无需另行开发。

### 3. `skills/ + tools/` 包格式成为 Aurum skill package 标准

judge-the-code 已解决了一个 Aurum 必须面对的技术问题：如何打包同时包含 Claude skill（自然语言 prompt）和确定性工具（Go binary）的复合技能单元。这个结构可以直接成为 Aurum skill package format 的参考规范。

### 三重循环

```
judge-the-code 帮企业审查 AI 生成的代码
        ↕
skill-review 帮 Aurum 审查进入 Marketplace 的 skill
        ↕
Aurum 把 judge-the-code 作为 skill 分发给企业客户
```

judge-the-code 既是平台上的**商品**，也是平台**治理机制**的一部分。

---

## GTM 策略

### 目标客户（起步）

**工程密集型、有内部 AI champion 的中大型科技公司：**
- 已有工程师自发使用 Claude Code
- 痛点明确：skill 散落在 Slack/个人 repo，没有治理
- 预算：$50K–$200K/年 enterprise SaaS

**第二 segment（Ramp 路径）：**
- 金融/法律/运营密集型企业
- skill 的价值在于把 policy 外部化（费用审批、合规检查）
- 对治理和审计有强需求，与 Promotion Workflow 自然契合

### 种子 Skill 库

judge-the-code 作为 Day-1 reference implementation，同时补充已验证的其他 skill 类型：
- **judge-the-code bundle**（code-explore / design-lens / demon-hunter / token-optimize / skill-review）
- CI 日志分类
- 费用合规检查
- 文档生成

---

## 关键产品决策

### 1. 锁定 Claude 生态 vs. Harness-agnostic？

**建议：先锁定 Claude Code / Claude API**
- Uber/Ramp/Shopify 全是 Anthropic 客户
- 可以成为 Claude for Work 的配套基础设施
- 之后扩展到 OpenAI/Gemini 生态

### 2. 平台优先 vs. 垂直 skill 优先？

Ramp 的教训："不要从平台开始，从解决一个真实痛点开始"

**建议：从某类高频 skill 打透（如代码审查或合规检查），平台是副产品。**

---

## 主要风险

| 风险 | 具体表现 | 应对策略 |
|---|---|---|
| Anthropic 自己做 | 他们有所有使用数据，可以直接内置 | 做深垂直集成（IT审批流、HR合规），平台层他们做不了 |
| Skill 可迁移性差 | 企业 A 的 skill 在企业 B 没用 | Commons 层专注"结构通用"的 skill（eval框架、代码审查规范） |
| 冷启动 | 没有 skill 就没有用户 | 用已知高价值 skill 做种子库，联合首批客户共建 |

---

## License 策略

**Core（Apache 2.0）** — 当前阶段采用，包含：
- Skill Registry 核心格式和 CLI
- Promotion Workflow 基础流程
- Team Sandbox 基本功能
- skill-review 集成

**Enterprise（商业 License）** — 有第一个付费客户前确定，预期包含：
- SSO / RBAC / 审计日志
- Multi-tenant 隔离
- ROI Dashboard 和高级分析
- SLA + 企业支持

不选 MIT 的原因：Anthropic 看到 Aurum 跑通后可直接内置到 Claude for Work，核心基础设施需要保留护城河。
不选 AGPL 的原因：企业法务团队大概率直接 block。
不选 BSL 的原因：HashiCorp/Terraform → OpenTofu 的教训，社区信任一旦失去难以恢复。

---

## 待讨论

- [ ] 切入点选择：基础设施层（管理工具）还是应用层（先做某个垂直行业 skill）？
- [ ] 商业模式：SaaS per seat、per skill execution、还是平台费 + rev share？
- [ ] 技术选型：skill 的格式标准化（judge-the-code 的 skills/+tools/ 结构是否直接作为 Aurum package format？）
- [ ] 是否需要一个 CLI 工具（类似 npm publish 的 skill 发布体验）

---

## 参考资料

- Uber Engineering · Claude Skills 增长时间线 · 2025
- Ramp · The Pragmatic Summit · 2026
- Shopify Pi-autoresearch · 2026
- Garry Tan · Thin Harness Fat Skills · 2026
- 内部幻灯片：`~/R129/Vault/agent-harness-v0.4.0.html`, `harness-showcase-v0.5.html`
- Day-1 reference implementation：`~/R129/judge-the-code/`
