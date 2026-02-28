---
name: review-dashboard
description: Scan a GitHub repo for open PRs you reviewed or commented on, deep-audit each using pr-feedback-audit and respond-pr methodology, then take actions (approve, request-changes, comment) with draft-first confirmation.
version: 1.0.0
---

# Review Dashboard

Orchestrates PR discovery, deep auditing, and review actions across a repository.
Delegates to existing skills rather than rolling its own analysis.

## Prerequisites

- `gh` CLI authenticated (`gh auth status`)
- `pr-feedback-audit` skill installed (thread status classification)
- `/respond-pr` or `/review-pr` command available (code verification)

## Workflow

### Phase 1: Discover PRs

Run the discovery script to find all open PRs where the user has interacted:

```bash
python3 PATH_TO_SKILL/scripts/review_dashboard.py discover --repo owner/repo
```

This returns a table of PRs with number, title, author, and interaction type.

### Phase 2: Audit Each PR (delegate to existing skills)

For each discovered PR, run a two-layer audit:

**Layer 1 — Thread status (pr-feedback-audit script):**

```bash
python3 PATH_TO_PR_FEEDBACK_AUDIT/scripts/check_pr_feedback.py --pr {number} --repo owner/repo --json
```

This gives mechanical thread classification (Resolved/Outdated/Addressed/Unresolved).

**Layer 2 — Code verification (respond-pr methodology):**

For each PR with unresolved or "Addressed" threads, follow the `/respond-pr` approach:

1. Fetch review comments: `gh api repos/{owner}/{repo}/pulls/{number}/comments`
2. For each unresolved comment, **read the actual code** at the referenced file and line
3. Determine if the issue was truly fixed, partially fixed, or still present
4. Classify: Already resolved, Valid (still open), or False positive

This is the critical step — never report a thread status without reading the code.

### Phase 3: Present Consolidated Report

Compile findings into a per-PR summary table:

| # | PR | Author | Threads | Verified Status | Action Needed |
|---|-----|--------|---------|-----------------|---------------|

Group PRs into:
1. **Ready to approve** — all feedback resolved or verified as addressed in code
2. **Needs attention** — unresolved threads confirmed by code reading
3. **Needs discussion** — disagreements or ambiguous fixes

### Phase 4: Take Actions (draft first)

When the user decides on an action, **always draft first**:

```bash
# Preview
python3 PATH_TO_SKILL/scripts/review_dashboard.py act \
  --pr 42 --action approve --draft

# Execute after user confirms
python3 PATH_TO_SKILL/scripts/review_dashboard.py act \
  --pr 42 --action approve
```

For request-changes, compose the body from verified unresolved items:

```bash
python3 PATH_TO_SKILL/scripts/review_dashboard.py act \
  --pr 42 --action request-changes --body "Please address: ..."
```

## User Interaction Patterns

After presenting the report, the user may say:
- **"approve #42"** — draft approval, show it, wait for confirmation
- **"approve all ready"** — draft approvals for all PRs in "ready" group
- **"request changes on #349: fix X and Y"** — draft request-changes
- **"comment on #361: looks good but consider Z"** — draft comment

Never post without user confirmation. Always show the draft first.

## Scaling Strategy

With many PRs (>10), use parallel subagents for Phase 2:
- Spawn one Explore subagent per PR for Layer 1 (pr-feedback-audit)
- For PRs needing Layer 2, spawn general-purpose subagents to read code
- Aggregate results in main context

## Script Options

### discover

| Flag | Description |
|------|-------------|
| `--repo owner/repo` | Repository (default: from git remote) |
| `--json` | Output JSON for programmatic use |

### act

| Flag | Description |
|------|-------------|
| `--pr <number or URL>` | PR number or full URL (required) |
| `--action <type>` | approve, request-changes, or comment (required) |
| `--body <text>` | Review comment body |
| `--draft` | Preview action without executing |

## References

- `references/thread-classification.md` — Two-layer audit strategy
- `references/action-patterns.md` — User interaction patterns and draft workflow
