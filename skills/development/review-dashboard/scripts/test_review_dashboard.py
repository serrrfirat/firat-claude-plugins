#!/usr/bin/env python3
"""Tests for review_dashboard.py (v2 - discover + act only)."""

import json
import subprocess
import unittest
from unittest.mock import MagicMock, patch

from review_dashboard import (
    detect_repo,
    execute_action,
    find_user_prs,
    format_action_draft,
    truncate,
)


class TestTruncate(unittest.TestCase):
    def test_short_text(self):
        self.assertEqual(truncate("hello"), "hello")

    def test_long_text(self):
        result = truncate("a" * 100, max_len=20)
        self.assertEqual(len(result), 20)
        self.assertTrue(result.endswith("..."))

    def test_newlines_replaced(self):
        result = truncate("line1\nline2\nline3")
        self.assertNotIn("\n", result)

    def test_exact_length(self):
        text = "a" * 80
        self.assertEqual(truncate(text, 80), text)

    def test_strips_whitespace(self):
        self.assertEqual(truncate("  hello  "), "hello")


class TestFormatActionDraft(unittest.TestCase):
    def test_approve_draft(self):
        result = format_action_draft("owner/repo", 42, "approve", None)
        self.assertIn("APPROVE", result)
        self.assertIn("#42", result)
        self.assertIn("owner/repo", result)
        self.assertIn("empty", result)

    def test_request_changes_with_body(self):
        result = format_action_draft(
            "owner/repo", 42, "request-changes", "Fix the bug"
        )
        self.assertIn("REQUEST_CHANGES", result)
        self.assertIn("Fix the bug", result)

    def test_comment_with_body(self):
        result = format_action_draft("owner/repo", 42, "comment", "Looks good")
        self.assertIn("COMMENT", result)
        self.assertIn("Looks good", result)

    def test_unknown_action_passes_through(self):
        result = format_action_draft("owner/repo", 42, "merge", None)
        self.assertIn("merge", result)


class TestDetectRepo(unittest.TestCase):
    @patch("review_dashboard.run_git")
    def test_ssh_remote(self, mock_git):
        mock_git.return_value = "git@github.com:owner/repo.git\n"
        result = detect_repo()
        self.assertEqual(result, "owner/repo")

    @patch("review_dashboard.run_git")
    def test_https_remote(self, mock_git):
        mock_git.return_value = "https://github.com/owner/repo.git\n"
        result = detect_repo()
        self.assertEqual(result, "owner/repo")

    @patch("review_dashboard.run_git")
    def test_https_no_git_suffix(self, mock_git):
        mock_git.return_value = "https://github.com/owner/repo\n"
        result = detect_repo()
        self.assertEqual(result, "owner/repo")

    @patch("review_dashboard.run_git")
    def test_no_remote_exits(self, mock_git):
        mock_git.return_value = None
        with self.assertRaises(SystemExit):
            detect_repo()

    @patch("review_dashboard.run_git")
    def test_unparseable_remote_exits(self, mock_git):
        mock_git.return_value = "https://gitlab.com/owner/repo.git\n"
        with self.assertRaises(SystemExit):
            detect_repo()


class TestFindUserPrs(unittest.TestCase):
    @patch("review_dashboard.run_gh")
    def test_deduplicates_prs(self, mock_gh):
        """Same PR from reviewer and commenter searches → single entry with 'both'."""
        pr_json = json.dumps([{
            "number": 42,
            "title": "Fix bug",
            "author": {"login": "alice"},
            "url": "https://github.com/o/r/pull/42",
        }])
        mock_gh.return_value = pr_json
        result = find_user_prs("o/r", "testuser")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["number"], 42)
        # Called 3 times (reviewed-by, commenter, review-requested)
        self.assertEqual(mock_gh.call_count, 3)

    @patch("review_dashboard.run_gh")
    def test_excludes_own_prs(self, mock_gh):
        """User's own PRs are excluded."""
        pr_json = json.dumps([{
            "number": 10,
            "title": "My PR",
            "author": {"login": "testuser"},
            "url": "https://github.com/o/r/pull/10",
        }])
        mock_gh.return_value = pr_json
        result = find_user_prs("o/r", "testuser")
        self.assertEqual(len(result), 0)

    @patch("review_dashboard.run_gh")
    def test_sorts_by_number(self, mock_gh):
        """Results are sorted by PR number."""
        def side_effect(args, check=True):
            if "reviewed-by" in str(args):
                return json.dumps([
                    {"number": 99, "title": "B", "author": {"login": "a"}, "url": "u1"},
                    {"number": 10, "title": "A", "author": {"login": "b"}, "url": "u2"},
                ])
            return "[]"
        mock_gh.side_effect = side_effect
        result = find_user_prs("o/r", "testuser")
        self.assertEqual(result[0]["number"], 10)
        self.assertEqual(result[1]["number"], 99)

    @patch("review_dashboard.run_gh")
    def test_handles_null_author(self, mock_gh):
        """PR with null author field doesn't crash."""
        pr_json = json.dumps([{
            "number": 5,
            "title": "Ghost PR",
            "author": None,
            "url": "https://github.com/o/r/pull/5",
        }])
        mock_gh.return_value = pr_json
        result = find_user_prs("o/r", "testuser")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["author"], "unknown")

    @patch("review_dashboard.run_gh")
    def test_interaction_both(self, mock_gh):
        """PR appearing in reviewer and commenter searches gets 'both' interaction."""
        def side_effect(args, check=True):
            if "reviewed-by" in str(args):
                return json.dumps([{
                    "number": 42, "title": "T", "author": {"login": "a"}, "url": "u"
                }])
            if "commenter" in str(args):
                return json.dumps([{
                    "number": 42, "title": "T", "author": {"login": "a"}, "url": "u"
                }])
            return "[]"
        mock_gh.side_effect = side_effect
        result = find_user_prs("o/r", "testuser")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["interaction"], "both")


class TestExecuteAction(unittest.TestCase):
    @patch("review_dashboard.subprocess.run")
    def test_approve_success(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        result = execute_action("o/r", 42, "approve", None)
        self.assertTrue(result)
        args = mock_run.call_args[0][0]
        self.assertIn("--approve", args)
        self.assertIn("--repo", args)

    @patch("review_dashboard.subprocess.run")
    def test_request_changes_with_body(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        result = execute_action("o/r", 42, "request-changes", "Fix X")
        self.assertTrue(result)
        args = mock_run.call_args[0][0]
        self.assertIn("--request-changes", args)
        self.assertIn("--body", args)
        self.assertIn("Fix X", args)

    @patch("review_dashboard.subprocess.run")
    def test_comment_action(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        result = execute_action("o/r", 42, "comment", "Note")
        self.assertTrue(result)
        args = mock_run.call_args[0][0]
        self.assertIn("--comment", args)

    @patch("review_dashboard.subprocess.run")
    def test_failure_returns_false(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="err")
        result = execute_action("o/r", 42, "approve", None)
        self.assertFalse(result)

    def test_unknown_action_returns_false(self):
        result = execute_action("o/r", 42, "merge", None)
        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()
