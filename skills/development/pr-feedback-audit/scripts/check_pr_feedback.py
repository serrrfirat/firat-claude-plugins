#!/usr/bin/env python3
"""Audit GitHub PR review threads to verify all feedback was addressed.

Fetches review threads via GraphQL, checks resolution/outdated status,
and runs git diff to confirm whether commented code was modified.
Outputs a structured markdown or JSON report.

Usage:
    python3 check_pr_feedback.py                    # current branch PR
    python3 check_pr_feedback.py --pr 42            # PR number
    python3 check_pr_feedback.py --pr https://github.com/o/r/pull/42
    python3 check_pr_feedback.py --auto-resolve     # resolve confirmed threads
    python3 check_pr_feedback.py --json             # JSON output
    python3 check_pr_feedback.py --exclude-resolved # skip resolved threads
"""

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Status(Enum):
    RESOLVED = "Resolved"
    OUTDATED = "Outdated"
    ADDRESSED = "Addressed"
    UNRESOLVED = "Unresolved"


@dataclass
class ThreadComment:
    author: str
    body: str
    created_at: str
    outdated: bool
    original_commit_oid: Optional[str] = None


@dataclass
class ReviewThread:
    thread_id: str
    path: str
    line: Optional[int]
    original_line: Optional[int]
    is_resolved: bool
    is_outdated: bool
    resolved_by: Optional[str]
    diff_hunk: str
    comments: list = field(default_factory=list)
    status: Status = Status.UNRESOLVED
    diff_evidence: Optional[str] = None


GRAPHQL_QUERY = """
query($owner: String!, $repo: String!, $pr: Int!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      title
      baseRefOid
      headRefOid
      reviewThreads(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          isCollapsed
          line
          originalLine
          path
          resolvedBy { login }
          comments(first: 50) {
            nodes {
              id
              body
              author { login }
              outdated
              path
              line
              originalLine
              diffHunk
              createdAt
              commit { oid }
              originalCommit { oid }
            }
          }
        }
      }
    }
  }
}
"""

RESOLVE_MUTATION = """
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { id isResolved }
  }
}
"""


def run_gh(args: list[str]) -> str:
    """Run a gh CLI command and return stdout."""
    result = subprocess.run(
        ["gh"] + args, capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        print(f"Error running gh {' '.join(args)}: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def run_git(args: list[str]) -> Optional[str]:
    """Run a git command and return stdout, or None on failure."""
    result = subprocess.run(
        ["git"] + args, capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        return None
    return result.stdout


def detect_repo() -> str:
    """Detect owner/repo from git remote."""
    remote_url = run_git(["remote", "get-url", "origin"])
    if not remote_url:
        print("Error: could not detect git remote", file=sys.stderr)
        sys.exit(1)
    remote_url = remote_url.strip()
    # SSH: git@github.com:owner/repo.git
    m = re.match(r"git@github\.com:(.+/.+?)(?:\.git)?$", remote_url)
    if m:
        return m.group(1)
    # HTTPS: https://github.com/owner/repo.git
    m = re.match(r"https://github\.com/(.+/.+?)(?:\.git)?$", remote_url)
    if m:
        return m.group(1)
    print(f"Error: could not parse remote URL: {remote_url}", file=sys.stderr)
    sys.exit(1)


def detect_pr_number(repo: str) -> int:
    """Detect PR number from current branch."""
    branch = run_git(["branch", "--show-current"])
    if not branch:
        print("Error: could not detect current branch", file=sys.stderr)
        sys.exit(1)
    branch = branch.strip()
    result = run_gh(["pr", "view", branch, "--repo", repo, "--json", "number"])
    data = json.loads(result)
    return data["number"]


def parse_pr_arg(pr_arg: str) -> tuple[Optional[str], int]:
    """Parse --pr argument. Returns (repo_or_none, pr_number)."""
    # Full URL: https://github.com/owner/repo/pull/42
    m = re.match(r"https://github\.com/([^/]+/[^/]+)/pull/(\d+)", pr_arg)
    if m:
        return m.group(1), int(m.group(2))
    # Just a number
    if pr_arg.isdigit():
        return None, int(pr_arg)
    print(f"Error: could not parse PR argument: {pr_arg}", file=sys.stderr)
    sys.exit(1)


def fetch_threads(owner: str, repo: str, pr_number: int) -> list[ReviewThread]:
    """Fetch all review threads via GraphQL with pagination."""
    threads = []
    cursor = None

    while True:
        variables = {"owner": owner, "repo": repo, "pr": pr_number}
        gh_args = [
            "api", "graphql",
            "-f", f"query={GRAPHQL_QUERY}",
            "-f", f"owner={owner}",
            "-f", f"repo={repo}",
            "-F", f"pr={pr_number}",
        ]
        if cursor:
            gh_args.extend(["-f", f"cursor={cursor}"])
        else:
            gh_args.extend(["-f", "cursor="])

        result = run_gh(gh_args)
        data = json.loads(result)

        pr_data = data.get("data", {}).get("repository", {}).get("pullRequest")
        if not pr_data:
            errors = data.get("errors", [])
            if errors:
                print(f"GraphQL errors: {json.dumps(errors, indent=2)}", file=sys.stderr)
            else:
                print("Error: PR not found", file=sys.stderr)
            sys.exit(1)

        thread_data = pr_data["reviewThreads"]
        for node in thread_data["nodes"]:
            comments = []
            for c in node["comments"]["nodes"]:
                author = c.get("author", {})
                original_commit = c.get("originalCommit") or {}
                comments.append(ThreadComment(
                    author=author.get("login", "unknown") if author else "unknown",
                    body=c["body"],
                    created_at=c["createdAt"],
                    outdated=c.get("outdated", False),
                    original_commit_oid=original_commit.get("oid"),
                ))

            resolved_by_data = node.get("resolvedBy")
            # diffHunk lives on comments, not threads
            first_comment_nodes = node["comments"]["nodes"]
            diff_hunk = first_comment_nodes[0].get("diffHunk", "") if first_comment_nodes else ""
            threads.append(ReviewThread(
                thread_id=node["id"],
                path=node["path"],
                line=node.get("line"),
                original_line=node.get("originalLine"),
                is_resolved=node["isResolved"],
                is_outdated=node["isOutdated"],
                resolved_by=resolved_by_data["login"] if resolved_by_data else None,
                diff_hunk=diff_hunk,
                comments=comments,
            ))

        page_info = thread_data["pageInfo"]
        if page_info["hasNextPage"]:
            cursor = page_info["endCursor"]
        else:
            break

    return threads


def parse_diff_hunks(diff_output: str) -> list[tuple[int, int]]:
    """Parse unified diff hunk headers into (old_start, old_count) tuples."""
    hunks = []
    for m in re.finditer(r"^@@ -(\d+)(?:,(\d+))? \+", diff_output, re.MULTILINE):
        start = int(m.group(1))
        count = int(m.group(2)) if m.group(2) else 1
        hunks.append((start, count))
    return hunks


def check_diff_overlap(original_commit_oid: str, path: str, original_line: int) -> tuple[bool, str]:
    """Check if git diff shows changes at the commented line.

    Returns (has_overlap, evidence_string).
    """
    if not original_commit_oid:
        return False, "no original commit"

    diff = run_git(["diff", original_commit_oid, "HEAD", "--", path])
    if diff is None:
        # Try checking if file was deleted
        check = run_git(["cat-file", "-t", f"HEAD:{path}"])
        if check is None:
            return True, "file deleted"
        return False, "diff failed"

    if not diff.strip():
        return False, "no changes in file"

    hunks = parse_diff_hunks(diff)
    for start, count in hunks:
        if start <= original_line <= start + count:
            return True, f"hunk @@ -{start},{count} overlaps line {original_line}"

    return False, f"no hunk overlaps line {original_line}"


def classify_threads(threads: list[ReviewThread]) -> list[ReviewThread]:
    """Classify each thread's status based on resolution, outdated, and diff."""
    for thread in threads:
        if thread.is_resolved:
            thread.status = Status.RESOLVED
            thread.diff_evidence = f"resolved by {thread.resolved_by or 'unknown'}"
            continue

        if thread.is_outdated:
            thread.status = Status.OUTDATED
            thread.diff_evidence = "GitHub detected code changed"
            continue

        # Unresolved + not outdated: check git diff
        original_commit = None
        if thread.comments:
            original_commit = thread.comments[0].original_commit_oid

        if original_commit and thread.original_line:
            has_overlap, evidence = check_diff_overlap(
                original_commit, thread.path, thread.original_line
            )
            thread.diff_evidence = evidence
            if has_overlap:
                thread.status = Status.ADDRESSED
            else:
                thread.status = Status.UNRESOLVED
        else:
            thread.status = Status.UNRESOLVED
            thread.diff_evidence = "unable to verify (missing commit/line info)"

    return threads


def resolve_thread(thread_id: str) -> bool:
    """Resolve a review thread via GraphQL mutation."""
    try:
        result = run_gh([
            "api", "graphql",
            "-f", f"query={RESOLVE_MUTATION}",
            "-f", f"threadId={thread_id}",
        ])
        data = json.loads(result)
        resolved = (
            data.get("data", {})
            .get("resolveReviewThread", {})
            .get("thread", {})
            .get("isResolved", False)
        )
        return resolved
    except Exception:
        return False


def truncate(text: str, max_len: int = 80) -> str:
    """Truncate text to max_len, adding ellipsis if needed."""
    text = text.replace("\n", " ").strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def format_markdown(threads: list[ReviewThread], exclude_resolved: bool = False) -> str:
    """Format threads as a markdown report."""
    if exclude_resolved:
        threads = [t for t in threads if t.status != Status.RESOLVED]

    if not threads:
        return "# PR Feedback Audit\n\nAll review threads are resolved."

    # Summary counts
    counts = {}
    for t in threads:
        counts[t.status] = counts.get(t.status, 0) + 1

    lines = ["# PR Feedback Audit\n"]
    lines.append("## Summary\n")
    for status in Status:
        if status in counts:
            emoji = {"Resolved": "OK", "Outdated": "~~", "Addressed": "->", "Unresolved": "!!"}
            lines.append(f"- **{status.value}**: {counts[status]} {emoji.get(status.value, '')}")
    lines.append("")

    # Detail table
    lines.append("## Details\n")
    lines.append("| Status | File | Reviewer | Comment | Evidence |")
    lines.append("|--------|------|----------|---------|----------|")

    for t in threads:
        first_comment = t.comments[0] if t.comments else None
        reviewer = first_comment.author if first_comment else "?"
        body = truncate(first_comment.body) if first_comment else ""
        loc = f"`{t.path}"
        if t.original_line:
            loc += f":{t.original_line}"
        loc += "`"
        evidence = t.diff_evidence or ""

        lines.append(
            f"| **{t.status.value}** | {loc} | {reviewer} | {body} | {evidence} |"
        )

    # Unresolved detail section
    unresolved = [t for t in threads if t.status == Status.UNRESOLVED]
    if unresolved:
        lines.append("\n## Unresolved Threads (Action Required)\n")
        for i, t in enumerate(unresolved, 1):
            first = t.comments[0] if t.comments else None
            lines.append(f"### {i}. `{t.path}:{t.original_line or '?'}`\n")
            if first:
                lines.append(f"**{first.author}** ({first.created_at}):\n")
                lines.append(f"> {first.body}\n")
            if t.diff_hunk:
                lines.append("```diff")
                lines.append(t.diff_hunk)
                lines.append("```\n")

    return "\n".join(lines)


def format_json(threads: list[ReviewThread]) -> str:
    """Format threads as JSON."""
    data = []
    for t in threads:
        data.append({
            "thread_id": t.thread_id,
            "path": t.path,
            "line": t.line,
            "original_line": t.original_line,
            "status": t.status.value,
            "is_resolved": t.is_resolved,
            "is_outdated": t.is_outdated,
            "resolved_by": t.resolved_by,
            "diff_evidence": t.diff_evidence,
            "comments": [
                {
                    "author": c.author,
                    "body": c.body,
                    "created_at": c.created_at,
                    "outdated": c.outdated,
                }
                for c in t.comments
            ],
        })
    return json.dumps(data, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Audit GitHub PR review feedback")
    parser.add_argument("--pr", help="PR number or URL (default: current branch)")
    parser.add_argument("--repo", help="owner/repo (default: from git remote)")
    parser.add_argument("--auto-resolve", action="store_true",
                        help="Resolve threads confirmed addressed")
    parser.add_argument("--json", action="store_true", dest="json_output",
                        help="Output JSON instead of markdown")
    parser.add_argument("--exclude-resolved", action="store_true",
                        help="Only show unresolved/outdated threads")
    args = parser.parse_args()

    # Determine repo
    if args.repo:
        repo = args.repo
    else:
        repo = detect_repo()

    owner, repo_name = repo.split("/", 1)

    # Determine PR number
    if args.pr:
        parsed_repo, pr_number = parse_pr_arg(args.pr)
        if parsed_repo:
            owner, repo_name = parsed_repo.split("/", 1)
    else:
        pr_number = detect_pr_number(repo)

    print(f"Auditing {owner}/{repo_name}#{pr_number}...", file=sys.stderr)

    # Fetch and classify
    threads = fetch_threads(owner, repo_name, pr_number)
    threads = classify_threads(threads)

    # Auto-resolve addressed threads
    if args.auto_resolve:
        for t in threads:
            if t.status == Status.ADDRESSED:
                success = resolve_thread(t.thread_id)
                if success:
                    t.status = Status.RESOLVED
                    t.diff_evidence = (t.diff_evidence or "") + " (auto-resolved)"
                    print(f"  Resolved: {t.path}:{t.original_line}", file=sys.stderr)

    # Output
    if args.json_output:
        print(format_json(threads))
    else:
        print(format_markdown(threads, args.exclude_resolved))


if __name__ == "__main__":
    main()
