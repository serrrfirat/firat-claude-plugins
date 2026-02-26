---
name: pr-feedback-audit
description: Audit GitHub PR review threads to verify all feedback was addressed. Generates structured report with resolution status and diff evidence.
version: 1.0.0
---

# PR Feedback Audit

Verify all GitHub PR review comments have been addressed before merging. Generates a structured markdown report showing each thread's resolution status with diff evidence.

## Prerequisites

- `gh` CLI authenticated (`gh auth status`)
- Git repo with remote configured

## Quick Start

Run the audit script for the current branch's PR:

```bash
python3 <skill_dir>/scripts/check_pr_feedback.py
```

Or specify a PR number:

```bash
python3 <skill_dir>/scripts/check_pr_feedback.py --pr 42
```

Or a full PR URL:

```bash
python3 <skill_dir>/scripts/check_pr_feedback.py --pr https://github.com/owner/repo/pull/42
```

**Note:** Replace `<skill_dir>` with the actual path to this skill's directory.

## Workflow

1. Run the script to fetch all review threads via GitHub GraphQL API
2. Each thread is categorized as: **Resolved**, **Outdated** (code changed), or **Unresolved**
3. For unresolved threads, `git diff` confirms whether commented lines were modified
4. Review the markdown report and address any unresolved items
5. Optionally auto-resolve threads confirmed as addressed via `--auto-resolve`

## Script Options

| Flag | Description |
|------|-------------|
| `--pr <number or URL>` | PR number or URL (default: current branch's PR) |
| `--repo <owner/repo>` | Repository (default: from git remote) |
| `--auto-resolve` | Resolve threads confirmed addressed via GraphQL mutation |
| `--json` | Output raw JSON instead of markdown report |
| `--exclude-resolved` | Only show unresolved/outdated threads |

## Report Format

The report outputs a markdown table per review thread:

| Column | Description |
|--------|-------------|
| Status | Resolved / Outdated / Unresolved / Addressed (diff confirms change) |
| File | File path and line number |
| Reviewer | Who left the comment |
| Comment | First comment body (truncated) |
| Evidence | Whether git diff shows changes at that location |

## Interpreting Results

- **Resolved**: Thread explicitly resolved on GitHub -- no action needed
- **Outdated**: GitHub detected code changed since comment -- likely addressed, verify
- **Addressed**: Unresolved on GitHub but `git diff` confirms changes at the commented location
- **Unresolved**: Code at commented location unchanged and thread not resolved -- needs attention

## Integration with Other Skills

Use this skill as a **verification gate** after addressing PR feedback:
1. Address feedback and push fixes
2. Run `pr-feedback-audit` to verify all threads were covered
3. Address any remaining unresolved items
