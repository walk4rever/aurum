# Aurum

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](CHANGELOG.md)

> Enterprise AI knowledge as GitHub — 把组织里散落的 Agent Skill 变成可治理、可复用、可流通的资产。

## Install

```bash
go install github.com/walk4rever/aurum/cmd/aurum@latest
```

Or build from source:

```bash
git clone https://github.com/walk4rever/aurum
cd aurum
make build
make install   # copies to /usr/local/bin
```

## Usage

```bash
# Browse available skill packages
aurum list

# Install a skill package to ~/.claude/aurum/skills/
aurum install judge-the-code

# Validate your aurum.json before publishing
aurum publish
```

## Skill Package Format

Add an `aurum.json` to any skill repo:

```json
{
  "name": "my-skill",
  "version": "0.1.0",
  "description": "What this skill does",
  "author": "your-github-handle",
  "license": "MIT",
  "skills": [
    "skills/my-skill"
  ],
  "tools": "tools/"
}
```

- **`skills/`** — Claude Code skill directories (natural language prompts)
- **`tools/`** — optional deterministic binaries called by the skills

## Available Packages

| Package | Description |
|---|---|
| [judge-the-code](https://github.com/walk4rever/judge-the-code) | Maintain judgment and taste over AI-generated code — security, design, token cost |

## Publishing a Package

1. Add `aurum.json` to your repo (`aurum publish` validates it)
2. Push to a public GitHub repository
3. Open a PR adding your entry to [`registry/index.json`](registry/index.json)

## License

Core: [Apache 2.0](LICENSE)  
Enterprise features: commercial license (forthcoming)

## Docs

- [Product Brief](docs/product-brief.md)
