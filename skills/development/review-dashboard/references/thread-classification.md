# Two-Layer Audit Strategy

## Layer 1: Mechanical Status (pr-feedback-audit)

Run `check_pr_feedback.py --json` per PR. Gives fast triage:

- **Resolved** — Thread resolved on GitHub. Low priority to re-verify.
- **Outdated** — GitHub detected code changed. Likely addressed, needs spot-check.
- **Addressed** — `git diff` overlaps commented line. Needs code reading to confirm.
- **Unresolved** — No resolution, no code change. Highest priority.

This layer is fast but shallow — "line changed" does not mean "issue fixed."

## Layer 2: Code Verification (respond-pr methodology)

For threads NOT in Resolved state, follow `/respond-pr` Step 3:

1. Read the current code at the referenced file and line
2. Determine if the issue raised in the comment is actually fixed
3. Check if the fix is correct (not just different)
4. Look for regressions introduced by the fix

### Classification after code reading

- **Verified fixed** — Read the code, the concern is genuinely addressed
- **Partially fixed** — Some aspects addressed, others remain
- **Not fixed** — Code changed but issue persists (or "Addressed" was false positive)
- **False positive** — Original comment was incorrect, no fix needed
- **Still open** — No code change, issue remains valid

## When to skip Layer 2

- PRs where ALL threads are Resolved — spot-check 1-2 randomly
- PRs with only Outdated threads — verify 1-2 if time permits
- PRs where user is only `commenter` (not assigned reviewer) — lower priority
