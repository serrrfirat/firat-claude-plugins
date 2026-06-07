# Code Review

Multi-agent code review orchestrator for GitHub PRs or local worktrees. It spawns specialized reviewer subagents, aggregates their findings, deduplicates overlapping issues, and emits either a batched GitHub PR review or local `.review/findings` files.

## What it does

1. Runs intent analysis before review when useful
2. Spawns 5 parallel reviewers: security, bugs, performance/concurrency, tests, and conventions
3. Aggregates and deduplicates findings by file and line overlap
4. Posts a single batched GitHub PR review in PR mode
5. Writes `.review/findings.json` and `.review/findings.md` in local mode

## Usage

```text
owner/repo#123
--local
--staged
--since origin/main
```

## Requirements

- `gh` CLI authenticated with repo access for PR reviews
- Git repository for local reviews
- Claude Code `Agent` tool support for reviewer subagents

## Installation

### Claude Code Marketplace

```bash
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install code-review@firat-claude-plugins
```

### Manual

```bash
git clone https://github.com/serrrfirat/firat-claude-plugins.git
claude --plugin-dir ./firat-claude-plugins/skills/development/code-review
```

## Credits

Imported from `/Users/firatsertgoz/.agents/skills/code-review`, originally requested as `claude-md/personal/henrypark133/code-review`.

## License

MIT
