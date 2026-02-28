---
name: pr-regression-check
description: "Analyze GitHub PR diffs for regression risks: breaking behavioral changes, default value shifts, wire format mutations, and config migration gaps."
version: 0.1.0
---

# PR Regression Check

Detect functional changes in a PR that could break existing users/deployments.
Not a code quality review — focuses exclusively on behavioral regression risk.

## When to Use

- User asks to review a PR for regression risk or merge readiness
- User asks "will this break anything?" or "is this safe to merge?"
- User asks to check backward compatibility of a PR

## Workflow

### 1. Gather PR context

```bash
gh pr view <number> --repo <owner/repo> --json title,body,files,additions,deletions
gh pr diff <number> --repo <owner/repo>
```

For large diffs, focus on non-lockfile changed files. Skip `*.lock`, `*.sum`.

### 2. Analyze each changed file

For each file, apply the regression pattern checklist: `references/regression-patterns.md`.
Read the **current file on the base branch** to understand existing behavior before
analyzing the diff. Use `git show main:<filepath>` or read the file directly.

### 3. Classify findings

Use risk levels from `references/risk-classification.md`. Every finding needs:
- What changed (before vs after)
- Who is affected (existing users, API consumers, config files)
- Severity (BREAKING / RISKY / SAFE)
- Migration path (what users must do, or "none needed")

### 4. Produce report

Output a structured summary per `references/report-template.md`.
Lead with the verdict: SAFE / MERGE WITH NOTES / HOLD.

### 5. Recommend action

- **SAFE**: No functional changes or all changes are additive/backward-compatible
- **MERGE WITH NOTES**: Behavioral changes exist but migration path exists
- **HOLD**: Breaking changes with no migration path; request author fix

## Key Principles

- Compare behavior, not code style. Renames/reformats/comments are not regressions.
- Default value changes are almost always breaking — flag every one.
- Serialization format changes (field type, name, required/optional) break wire compat.
- Config schema changes without migration = broken existing deployments.
- "Additive only" changes (new fields with defaults, new endpoints) are generally safe.
