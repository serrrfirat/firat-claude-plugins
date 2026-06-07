# Code Review

Paranoid architect review of local code changes or GitHub pull requests. The skill checks for bugs, security issues, missing tests, undocumented assumptions, edge cases, and architectural concerns.

## What it does

1. Reviews local diffs or GitHub pull requests
2. Reads changed files in full context before writing findings
3. Reviews across six lenses: correctness, edge cases, security, tests, documentation, and architecture
4. Produces severity-ranked findings with concrete fixes
5. Can post approved findings as GitHub PR comments

## Usage

```text
review local changes
review owner/repo#123
review https://github.com/owner/repo/pull/123
```

## Requirements

- Git access for local reviews
- GitHub access for PR reviews
- `github` skill available when reviewing or commenting on PRs

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

Imported from `claude-md/personal/henrypark133/code-review`.

## License

MIT
