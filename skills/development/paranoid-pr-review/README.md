# Paranoid PR Review

A paranoid architect-level code review skill for Claude Code. Fetches the full PR diff, reads every changed file in full context, then performs deep review across 6 lenses — posting findings directly as GitHub PR comments.

## What it does

1. **Fetches PR metadata and diff** via `gh` CLI
2. **Reads every changed file in full** (not just diff hunks) for surrounding context
3. **Reviews across 6 lenses**: correctness, edge cases, security, test coverage, documentation, architecture
4. **Presents findings** in a severity-ranked table
5. **Posts approved findings** as inline GitHub PR comments at the exact file/line

## Review Lenses

| Lens              | What it catches                                                    |
| ----------------- | ------------------------------------------------------------------ |
| **Correctness**   | Off-by-one, wrong comparisons, type confusion, race conditions     |
| **Edge cases**    | Empty input, None/null, overflow, malformed data, partial failures |
| **Security**      | Auth bypass, injection, data leakage, DoS, replay attacks          |
| **Test coverage** | Missing tests, untested error paths, stale assertions              |
| **Documentation** | Undocumented assumptions, missing API contracts, stale TODOs       |
| **Architecture**  | Pattern violations, tight coupling, premature abstractions         |

## Severity Levels

- **Critical** — Security vulnerability, data loss, or financial exploit
- **High** — Bug that will cause incorrect behavior in production
- **Medium** — Robustness issue, missing validation, incomplete error handling
- **Low** — Style, naming, documentation, minor improvement
- **Nit** — Optional suggestion, take-it-or-leave-it

## Usage

```
/paranoid-pr-review 123
/paranoid-pr-review https://github.com/owner/repo/pull/123
```

The skill always asks for confirmation before posting any comments to the PR.

## Requirements

- `gh` CLI authenticated with repo access
- PR must be in the current repo (or provide full URL)

## Installation

### Claude Code Marketplace

```bash
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install paranoid-pr-review@firat-claude-plugins
```

### Manual

```bash
git clone https://github.com/serrrfirat/firat-claude-plugins.git
claude --plugin-dir ./firat-claude-plugins/skills/development/paranoid-pr-review
```

## License

MIT
