# PR Feedback Audit

Audit GitHub PR review threads to verify all feedback was addressed before merging. Generates a structured markdown report showing each thread's resolution status with diff evidence.

## What It Does

- Fetches all review threads from a GitHub PR via GraphQL API
- Classifies each thread: **Resolved**, **Outdated**, **Addressed**, or **Unresolved**
- Runs `git diff` to confirm whether commented code was actually modified
- Outputs a markdown table or JSON report
- Optionally auto-resolves threads confirmed as addressed

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- Python 3.9+
- Git repo with remote configured

## Usage

```bash
# Audit current branch's PR
python3 scripts/check_pr_feedback.py

# Audit a specific PR by number
python3 scripts/check_pr_feedback.py --pr 42

# Audit by full URL
python3 scripts/check_pr_feedback.py --pr https://github.com/owner/repo/pull/42

# JSON output
python3 scripts/check_pr_feedback.py --pr 42 --json

# Only show unresolved threads
python3 scripts/check_pr_feedback.py --pr 42 --exclude-resolved

# Auto-resolve threads confirmed as addressed
python3 scripts/check_pr_feedback.py --pr 42 --auto-resolve
```

## Status Meanings

| Status | Meaning |
|--------|---------|
| **Resolved** | Thread explicitly resolved on GitHub |
| **Outdated** | GitHub detected code changed since the comment was made |
| **Addressed** | Unresolved on GitHub, but `git diff` confirms changes at the commented location |
| **Unresolved** | Code at commented location unchanged and thread not resolved |

## Running Tests

```bash
python3 -m pytest scripts/test_check_pr_feedback.py -v
# or
python3 scripts/test_check_pr_feedback.py
```

## How It Works

1. Uses GitHub GraphQL API to fetch review threads with `isResolved` and `isOutdated` fields (REST API doesn't expose these)
2. For unresolved, non-outdated threads, runs `git diff <original_commit> HEAD -- <path>` to check if the commented lines were modified
3. Parses unified diff hunk headers to determine if any hunk overlaps with the commented line range
4. Reports findings in a structured markdown table with an "Action Required" section for truly unresolved threads

## License

MIT
