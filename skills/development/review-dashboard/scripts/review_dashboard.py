#!/usr/bin/env python3
"""Review Dashboard - Discover PRs and execute review actions.

This script handles two concerns:
  1. Discovery: find all open PRs where the user commented or is assigned reviewer
  2. Actions: execute approve/request-changes/comment with draft-first support

Thread auditing and code verification are handled by other skills:
  - pr-feedback-audit: thread status classification
  - respond-pr / review-pr: actual code reading and verification

Usage:
    # Discover PRs you've interacted with
    python3 review_dashboard.py discover
    python3 review_dashboard.py discover --repo owner/repo
    python3 review_dashboard.py discover --json

    # Take action on a specific PR (draft first)
    python3 review_dashboard.py act --pr 42 --action approve --draft
    python3 review_dashboard.py act --pr 42 --action approve
    python3 review_dashboard.py act --pr 42 --action request-changes --body "Fix X"
"""

import argparse
import json
import re
import subprocess
import sys
from typing import Optional


def run_gh(args: list[str], check: bool = True) -> str:
    """Run a gh CLI command and return stdout."""
    result = subprocess.run(
        ["gh"] + args, capture_output=True, text=True, timeout=60
    )
    if check and result.returncode != 0:
        print(f"Error: gh {' '.join(args)}: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def run_git(args: list[str]) -> Optional[str]:
    """Run a git command and return stdout, or None on failure."""
    result = subprocess.run(
        ["git"] + args, capture_output=True, text=True, timeout=30
    )
    return result.stdout if result.returncode == 0 else None


def detect_repo() -> str:
    """Detect owner/repo from git remote."""
    remote = run_git(["remote", "get-url", "origin"])
    if not remote:
        print("Error: could not detect git remote", file=sys.stderr)
        sys.exit(1)
    remote = remote.strip()
    m = re.match(r"(?:git@github\.com:|https://github\.com/)(.+/.+?)(?:\.git)?$", remote)
    if m:
        return m.group(1)
    print(f"Error: could not parse remote URL: {remote}", file=sys.stderr)
    sys.exit(1)


def get_current_user() -> str:
    """Get the authenticated GitHub username."""
    result = run_gh(["api", "user", "--jq", ".login"])
    return result.strip()


def find_user_prs(repo: str, username: str) -> list[dict]:
    """Find all open PRs where user commented or is assigned reviewer."""
    seen = {}

    for search_term, interaction_type in [
        (f"reviewed-by:{username}", "reviewer"),
        (f"commenter:{username}", "commenter"),
        (f"review-requested:{username}", "reviewer"),
    ]:
        result = run_gh([
            "pr", "list", "--repo", repo,
            "--search", search_term,
            "--state", "open",
            "--json", "number,title,author,url",
            "--limit", "100",
        ])
        prs = json.loads(result)
        for pr in prs:
            num = pr["number"]
            author = pr.get("author", {})
            author_login = author.get("login", "unknown") if author else "unknown"
            if num in seen:
                if seen[num]["interaction"] != interaction_type:
                    seen[num]["interaction"] = "both"
            else:
                seen[num] = {
                    "number": num,
                    "title": pr["title"],
                    "author": author_login,
                    "url": pr["url"],
                    "interaction": interaction_type,
                }

    # Exclude user's own PRs
    return sorted(
        [pr for pr in seen.values() if pr["author"] != username],
        key=lambda p: p["number"],
    )


def truncate(text: str, max_len: int = 60) -> str:
    text = text.replace("\n", " ").strip()
    return text if len(text) <= max_len else text[:max_len - 3] + "..."


# ---------------------------------------------------------------------------
# Discover subcommand
# ---------------------------------------------------------------------------

def cmd_discover(args):
    """Discover PRs the user has interacted with."""
    repo = args.repo or detect_repo()
    username = get_current_user()

    print(f"Scanning {repo} for @{username}'s reviews...", file=sys.stderr)
    prs = find_user_prs(repo, username)

    if not prs:
        print(f"No open PRs found where @{username} has reviewed or commented.")
        return

    print(f"Found {len(prs)} open PRs.", file=sys.stderr)

    if args.json_output:
        print(json.dumps(prs, indent=2))
    else:
        print(f"# Open PRs reviewed by @{username} in {repo}\n")
        print(f"| # | Title | Author | Role | URL |")
        print(f"|---|-------|--------|------|-----|")
        for pr in prs:
            title = truncate(pr["title"])
            print(f"| {pr['number']} | {title} | @{pr['author']} "
                  f"| {pr['interaction']} | [Link]({pr['url']}) |")
        print(f"\n**{len(prs)}** open PRs total.")


# ---------------------------------------------------------------------------
# Act subcommand
# ---------------------------------------------------------------------------

def format_action_draft(repo: str, pr_number: int, action: str, body: Optional[str]) -> str:
    action_labels = {
        "approve": "APPROVE",
        "request-changes": "REQUEST_CHANGES",
        "comment": "COMMENT",
    }
    lines = [
        "# Action Draft\n",
        f"**Repository:** {repo}",
        f"**PR:** #{pr_number}",
        f"**Action:** {action_labels.get(action, action)}",
    ]
    if body:
        lines.append(f"\n**Body:**\n> {body}")
    else:
        lines.append("\n**Body:** _(empty - will submit without comment)_")
    lines.append("\n---")
    lines.append("To execute, run the same command without `--draft`.")
    return "\n".join(lines)


def execute_action(repo: str, pr_number: int, action: str, body: Optional[str]) -> bool:
    gh_args = ["pr", "review", str(pr_number), "--repo", repo]

    if action == "approve":
        gh_args.append("--approve")
    elif action == "request-changes":
        gh_args.append("--request-changes")
    elif action == "comment":
        gh_args.append("--comment")
    else:
        print(f"Error: unknown action '{action}'", file=sys.stderr)
        return False

    if body:
        gh_args.extend(["--body", body])

    result = subprocess.run(
        ["gh"] + gh_args, capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr.strip()}", file=sys.stderr)
        return False
    return True


def cmd_act(args):
    """Take action on a PR."""
    repo = args.repo or detect_repo()

    pr_arg = args.pr
    m = re.match(r"https://github\.com/([^/]+/[^/]+)/pull/(\d+)", pr_arg)
    if m:
        repo = m.group(1)
        pr_number = int(m.group(2))
    elif pr_arg.isdigit():
        pr_number = int(pr_arg)
    else:
        print(f"Error: could not parse PR: {pr_arg}", file=sys.stderr)
        sys.exit(1)

    if args.draft:
        print(format_action_draft(repo, pr_number, args.action, args.body))
        return

    success = execute_action(repo, pr_number, args.action, args.body)
    if success:
        action_past = {
            "approve": "approved",
            "request-changes": "requested changes on",
            "comment": "commented on",
        }
        print(f"Successfully {action_past.get(args.action, args.action)} "
              f"{repo}#{pr_number}")
    else:
        sys.exit(1)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Review Dashboard - Discover PRs and execute review actions"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # discover subcommand
    disc = subparsers.add_parser("discover", help="Find PRs you've reviewed")
    disc.add_argument("--repo", help="owner/repo (default: from git remote)")
    disc.add_argument("--json", action="store_true", dest="json_output",
                      help="Output JSON instead of markdown table")

    # act subcommand
    act = subparsers.add_parser("act", help="Take action on a PR")
    act.add_argument("--pr", required=True, help="PR number or URL")
    act.add_argument("--action", required=True,
                     choices=["approve", "request-changes", "comment"])
    act.add_argument("--body", help="Review comment body")
    act.add_argument("--repo", help="owner/repo (default: from git remote)")
    act.add_argument("--draft", action="store_true",
                     help="Preview action without executing")

    args = parser.parse_args()
    if args.command == "discover":
        cmd_discover(args)
    elif args.command == "act":
        cmd_act(args)


if __name__ == "__main__":
    main()
