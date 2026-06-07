---
name: code-review
description: Multi-agent code review. Spawns 5 parallel reviewer subagents (Security, Bugs, Performance/Concurrency, Tests, Conventions) plus an intent analyzer. Reviews a GitHub PR (posts a single batched PR Review) OR self-reviews the current worktree (writes .review/findings.{json,md}).
allowed-tools: Bash(gh api:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(git worktree:*), Bash(git log:*), Bash(git diff:*), Bash(git symbolic-ref:*), Bash(git branch:*), Bash(find:*), Bash(realpath:*), Bash(jq:*), Bash(shasum:*), Bash(mkdir:*), Bash(grep:*), Read, Write, Edit, Glob, Agent
argument-hint: "[owner/repo#N | --local | --staged | --since <ref>]"
---

# Multi-agent code review (orchestrator)

You are the orchestrator for a multi-agent code review. You spawn 5 specialized reviewer subagents in parallel via the `Agent` tool, aggregate their findings, deduplicate by file+line overlap, filter by confidence ≥ 50, and emit either a single batched GitHub PR Review (PR mode) or a structured findings file at `.review/` (Local mode).

## Reviewer file paths

```sh
skill_dir="$(dirname "$(realpath "$0" 2>/dev/null)")"
# Fallback: find from repo root or knowledge-base location
if [ ! -d "$skill_dir/reviewers" ]; then
  skill_dir="$(git rev-parse --show-toplevel 2>/dev/null)/skills/code-review"
fi
reviewer_dir="$skill_dir/reviewers"
```

Use `$reviewer_dir/<reviewer>.md` in all prompt references below.

## Mode detection

Parse `$ARGUMENTS`:

- Contains `owner/repo N`, `owner/repo#N`, or `github.com/.../pull/N` → **PR mode**.
- Otherwise → **Local mode**.

Flags: `--pr`, `--local`, `--staged`, `--working`, `--since <ref>`, `--intent "<text>"`, `--force`.

## Setup phase (mode-dependent)

### PR mode

1. Parse `owner`, `repo`, `number` from `$ARGUMENTS`.
2. Fetch PR metadata: `gh api 'repos/<owner>/<repo>/pulls/<number>'` (always single-quote URLs to avoid zsh glob on `?`/`&`).
3. Reject early (unless `--force`):
   - PR state is `closed` or `merged` → tell user, do not proceed.
   - PR is `draft: true` → tell user, do not proceed.
   - PR has an existing review with marker `<!-- code-review-skill:v1 -->` → tell user, do not proceed.
4. Capture `head_sha`, `base_sha`, `pr_title`, `pr_body`, `pr_labels`.
5. Fetch unified diff: `gh pr diff <number> --repo <owner>/<repo>`.
6. Fetch changed-files list: `gh api 'repos/<owner>/<repo>/pulls/<number>/files?per_page=100' --jq '.[].filename'`.
7. Build ephemeral worktree:
   - `git fetch origin pull/<number>/head:cr-tmp-<number>`
   - `mkdir -p .cr-worktrees && git worktree add --detach ".cr-worktrees/$number" "$head_sha"`
   - If fails: continue in diff-only mode.
   - `worktree_path = .cr-worktrees/$number` (resolve via `realpath`).

### Local mode

1. `worktree_path = $(git rev-parse --show-toplevel)`. If exit ≠ 0: stop "not in a git repo".
2. `head_sha = $(git rev-parse HEAD)`.
3. Auto-detect base: `git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`. Fallback `main`, then `master`.
4. Resolve diff scope from flags:
   - default: `git diff origin/<base>...HEAD`
   - `--staged`: `git diff --cached`
   - `--working`: `git diff HEAD`
   - `--since <ref>`: `git diff <ref>...HEAD`
5. Get changed files: `git diff --name-only <base_sha>...HEAD`.
6. Cache-key check (unless `--force`): if `.review/findings.json` exists with matching `cache_key`, prompt: refresh / view / cancel.

## Intent analyzer (sequential, before reviewers)

Skip if: PR body empty AND no labels (PR mode); or current branch is main/master (Local mode).

Dispatch via `Agent` tool:
- **subagent_type:** `general-purpose`
- **description:** `"intent analysis"`
- **prompt:**
  ```
  <contents of $reviewer_dir/intent-analyzer.md>

  ## Input
  ```json
  {
    "mode": "<pr|local>",
    "intent_source": "<pr|commits|user-provided>",
    "pr_meta": { "title": "...", "body": "...", "labels": [...] },
    "branch_meta": { "branch": "...", "recent_commits": [...] },
    "user_intent": "<--intent value or null>",
    "changed_files": [...]
  }
  ```
  ```

Parse returned JSON → `intent_summary`. If parse fails: `intent_summary = null`.

## Parallel reviewer dispatch

Build the **context bundle** (JSON, ≤ 60 000 chars on `diff`):

```json
{
  "mode": "pr" | "local",
  "worktree_path": "<abs path>",
  "diff": "<unified diff, truncated to 60000 chars>",
  "head_sha": "<sha>",
  "base_sha": "<sha>",
  "changed_files": ["..."],
  "repo_rules_paths": ["<paths to CLAUDE.md, .claude/rules/*.md, AGENTS.md>"],
  "pr_meta": { "title": "...", "body": "...", "labels": [...] },
  "branch_meta": { "branch": "...", "recent_commits": [...] }
}
```

Locate repo-rule files:
```sh
find "$worktree_path" -maxdepth 4 \( -name CLAUDE.md -o -name AGENTS.md -o -name CONTRIBUTING.md \) 2>/dev/null
find "$worktree_path/.claude/rules" -name '*.md' 2>/dev/null
```

**In a single message, call the `Agent` tool 5 times in parallel** — Claude Code dispatches them concurrently:

For each of `security`, `bugs`, `performance`, `tests`, `conventions`:

- **subagent_type:** `general-purpose`
- **description:** `"<reviewer> code review"`
- **prompt:**
  ```
  <contents of $reviewer_dir/<reviewer>.md>

  ## Context bundle
  ```json
  <bundle JSON>
  ```

  ## Intent summary
  <intent_summary JSON, or "(none)" if null>
  ```

Each reviewer returns a JSON array of findings (or `[]`). If a reviewer's response can't be parsed as JSON: treat as failed, record in `reviewers_failed`, continue with remaining 4.

## Aggregation

1. **Collect:** flatten 5 reviewer arrays. Assign `id` (`f-<reviewer-prefix>-<index>`) and `reviewer` field.
2. **Anchor gate (Conventions only):** drop findings with empty `anchor`.
3. **Filter:** keep confidence ≥ 50.
4. **Dedup by overlap:** bucket by `(normalized_path, line_range_overlap)`. Keep highest-confidence as primary; attach others as `also_flagged_by`.
5. **Cap (PR mode only):** ≤ 15 inline comments (severity DESC, confidence DESC, category-balanced).
6. **Conventions severity cap:** demote above Medium unless anchor cites Critical-tier rule.

## Emit — PR mode

Build a single batched PR review via `POST /repos/<owner>/<repo>/pulls/<number>/reviews`:

- `commit_id`: `head_sha`
- `event`: `REQUEST_CHANGES` (Critical/High ≥75%), `APPROVE` (zero findings), `COMMENT` (else)
- `body`: starts with `<!-- code-review-skill:v1 -->`, then stats + per-category findings
- `comments`: ≤ 15 inline (path, line, side, body with fix)

```sh
jq -n \
  --arg body "$BODY" --arg event "$EVENT" \
  --arg commit_id "$HEAD_SHA" --argjson comments "$COMMENTS_JSON" \
  '{body: $body, event: $event, commit_id: $commit_id, comments: $comments}' \
  > /tmp/cr-review-payload.json

gh api "repos/$OWNER/$REPO/pulls/$NUMBER/reviews" \
  -X POST --input /tmp/cr-review-payload.json
```

**Always cleanup** (even on POST failure):
```sh
git worktree remove --force "$worktree_path" 2>/dev/null
git branch -D "cr-tmp-${number}" 2>/dev/null
```

## Emit — Local mode

Write `.review/findings.json` and `.review/findings.md`. Archive to `.review/archive/<head_sha>-<unix_ts>.json|.md`.

Ensure `.review/` is in `.gitignore`. Print console summary.

## Failure modes

| Failure | Behavior |
|---|---|
| Not in git repo (Local) | Error, stop |
| Empty diff | Skip: "no changes to review" |
| Cache-key match (Local, no --force) | Prompt: refresh / view / cancel |
| Ephemeral worktree fails (PR) | Continue diff-only mode |
| Intent analyzer fails | Continue with `intent_summary = null` |
| One reviewer fails | Continue with 4; add to `reviewers_failed` |
| All reviewers fail | "review could not be completed"; no posts/writes |
| PR review POST fails | Surface error + still cleanup worktree |

## Shell hygiene

- Single-quote all URLs with `?`, `&`, `#`, `*`, `[`, `]`, `~`.
- Use `--input <file>` for `gh api -X POST` JSON payloads.
- Check exit codes on every `git rev-parse`, `git fetch`, `git worktree add`.
