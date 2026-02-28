# Review Dashboard

Scan a GitHub repo for all open PRs where you left review comments or are assigned as a reviewer. Audit each PR's review threads using a two-layer strategy (mechanical classification + actual code reading), then take actions with a draft-first confirmation flow.

## Installation

```
/install serrrfirat/firat-claude-plugins/skills/development/review-dashboard
```

## Prerequisites

- `gh` CLI authenticated (`gh auth status`)
- Git repo with remote configured (or pass `--repo owner/repo`)
- `pr-feedback-audit` skill installed (for Layer 1 thread classification)

## Usage

Invoke the skill by asking Claude to scan your PRs:

```
/review-dashboard https://github.com/owner/repo/pulls
```

Or simply:

```
Scan my open PR reviews on owner/repo
```

## How It Works

### Two-Layer Audit Strategy

**Layer 1 — Mechanical Status** (fast, shallow):
Uses `pr-feedback-audit` to classify each review thread as Resolved, Outdated, Addressed, or Unresolved based on GitHub API data and git diff overlap.

**Layer 2 — Code Verification** (slow, thorough):
For threads not in Resolved state, Claude reads the actual code at the referenced file and line to determine if the issue was genuinely fixed, partially fixed, or still present.

### Actions

After reviewing the report, you can:
- **Approve** PRs where all feedback is resolved
- **Request changes** on PRs with verified unresolved issues
- **Comment** with observations or questions

All actions use a draft-first flow — Claude shows you exactly what will be posted and waits for your explicit confirmation before executing.

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/review_dashboard.py discover` | Find PRs you've interacted with |
| `scripts/review_dashboard.py act` | Execute review actions (approve, request-changes, comment) |

## License

MIT
