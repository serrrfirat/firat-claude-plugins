#!/usr/bin/env python3
"""Tests for check_pr_feedback.py.

Tests cover parsing, classification, diff analysis, and formatting logic.
Does NOT require gh CLI or network access -- all external calls are mocked.
"""

import json
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, __import__("os").path.dirname(__file__))

from check_pr_feedback import (
    ReviewThread,
    Status,
    ThreadComment,
    classify_threads,
    format_json,
    format_markdown,
    parse_diff_hunks,
    parse_pr_arg,
    truncate,
)


class TestParsePrArg(unittest.TestCase):
    def test_full_url(self):
        repo, num = parse_pr_arg("https://github.com/owner/repo/pull/42")
        self.assertEqual(repo, "owner/repo")
        self.assertEqual(num, 42)

    def test_number_only(self):
        repo, num = parse_pr_arg("123")
        self.assertIsNone(repo)
        self.assertEqual(num, 123)

    def test_invalid_exits(self):
        with self.assertRaises(SystemExit):
            parse_pr_arg("not-a-pr")


class TestParseDiffHunks(unittest.TestCase):
    def test_single_hunk(self):
        diff = "@@ -10,5 +12,7 @@ fn foo() {"
        hunks = parse_diff_hunks(diff)
        self.assertEqual(hunks, [(10, 5)])

    def test_multiple_hunks(self):
        diff = (
            "@@ -1,3 +1,4 @@\n"
            " some context\n"
            "@@ -20,10 +21,12 @@ fn bar() {\n"
            " more context\n"
        )
        hunks = parse_diff_hunks(diff)
        self.assertEqual(hunks, [(1, 3), (20, 10)])

    def test_no_count(self):
        diff = "@@ -5 +5 @@ single line"
        hunks = parse_diff_hunks(diff)
        self.assertEqual(hunks, [(5, 1)])

    def test_empty_diff(self):
        self.assertEqual(parse_diff_hunks(""), [])


class TestTruncate(unittest.TestCase):
    def test_short_text(self):
        self.assertEqual(truncate("hello", 80), "hello")

    def test_long_text(self):
        text = "a" * 100
        result = truncate(text, 80)
        self.assertEqual(len(result), 80)
        self.assertTrue(result.endswith("..."))

    def test_newlines_stripped(self):
        self.assertEqual(truncate("line1\nline2\nline3"), "line1 line2 line3")


class TestClassifyThreads(unittest.TestCase):
    def _make_thread(self, is_resolved=False, is_outdated=False,
                     original_commit="abc123", original_line=10):
        return ReviewThread(
            thread_id="PRRT_test",
            path="src/main.rs",
            line=10,
            original_line=original_line,
            is_resolved=is_resolved,
            is_outdated=is_outdated,
            resolved_by="reviewer" if is_resolved else None,
            diff_hunk="@@ -8,5 +8,7 @@",
            comments=[
                ThreadComment(
                    author="reviewer",
                    body="Fix this",
                    created_at="2026-01-01T00:00:00Z",
                    outdated=is_outdated,
                    original_commit_oid=original_commit,
                )
            ],
        )

    def test_resolved_thread(self):
        thread = self._make_thread(is_resolved=True)
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.RESOLVED)

    def test_outdated_thread(self):
        thread = self._make_thread(is_outdated=True)
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.OUTDATED)

    @patch("check_pr_feedback.run_git")
    def test_addressed_via_diff(self, mock_git):
        # git diff returns hunk that overlaps with line 10
        mock_git.return_value = "@@ -8,5 +8,7 @@ fn something() {\n+new line\n"
        thread = self._make_thread()
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.ADDRESSED)

    @patch("check_pr_feedback.run_git")
    def test_unresolved_no_overlap(self, mock_git):
        # git diff returns hunk that does NOT overlap with line 10
        mock_git.return_value = "@@ -50,3 +50,5 @@ fn other() {\n+new line\n"
        thread = self._make_thread()
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.UNRESOLVED)

    @patch("check_pr_feedback.run_git")
    def test_unresolved_no_changes(self, mock_git):
        mock_git.return_value = ""
        thread = self._make_thread()
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.UNRESOLVED)

    def test_no_commit_info(self):
        thread = self._make_thread(original_commit=None)
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.UNRESOLVED)
        self.assertIn("missing", result[0].diff_evidence)

    @patch("check_pr_feedback.run_git")
    def test_file_deleted(self, mock_git):
        # First call (diff) returns None, second call (cat-file) also returns None
        mock_git.side_effect = [None, None]
        thread = self._make_thread()
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.ADDRESSED)
        self.assertIn("deleted", result[0].diff_evidence)


class TestFormatMarkdown(unittest.TestCase):
    def _make_thread(self, status, path="src/main.rs", line=10):
        t = ReviewThread(
            thread_id="PRRT_test",
            path=path,
            line=line,
            original_line=line,
            is_resolved=(status == Status.RESOLVED),
            is_outdated=(status == Status.OUTDATED),
            resolved_by=None,
            diff_hunk="",
            comments=[
                ThreadComment(
                    author="reviewer",
                    body="Fix this issue",
                    created_at="2026-01-01T00:00:00Z",
                    outdated=False,
                )
            ],
            status=status,
            diff_evidence="test evidence",
        )
        return t

    def test_all_resolved(self):
        threads = [self._make_thread(Status.RESOLVED)]
        result = format_markdown(threads, exclude_resolved=True)
        self.assertIn("All review threads are resolved", result)

    def test_includes_unresolved_section(self):
        threads = [self._make_thread(Status.UNRESOLVED)]
        result = format_markdown(threads)
        self.assertIn("Unresolved Threads (Action Required)", result)
        self.assertIn("src/main.rs:10", result)

    def test_summary_counts(self):
        threads = [
            self._make_thread(Status.RESOLVED),
            self._make_thread(Status.UNRESOLVED),
            self._make_thread(Status.OUTDATED),
        ]
        result = format_markdown(threads)
        self.assertIn("**Resolved**: 1", result)
        self.assertIn("**Unresolved**: 1", result)
        self.assertIn("**Outdated**: 1", result)

    def test_table_format(self):
        threads = [self._make_thread(Status.ADDRESSED)]
        result = format_markdown(threads)
        self.assertIn("| **Addressed**", result)
        self.assertIn("reviewer", result)


class TestFormatJson(unittest.TestCase):
    def test_json_output(self):
        thread = ReviewThread(
            thread_id="PRRT_1",
            path="test.rs",
            line=5,
            original_line=5,
            is_resolved=False,
            is_outdated=False,
            resolved_by=None,
            diff_hunk="",
            comments=[
                ThreadComment(
                    author="user1",
                    body="Please fix",
                    created_at="2026-01-01T00:00:00Z",
                    outdated=False,
                )
            ],
            status=Status.UNRESOLVED,
            diff_evidence="no changes",
        )
        result = format_json([thread])
        data = json.loads(result)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["status"], "Unresolved")
        self.assertEqual(data[0]["path"], "test.rs")
        self.assertEqual(data[0]["comments"][0]["author"], "user1")


class TestResolvedPriority(unittest.TestCase):
    """Verify that resolved takes precedence over outdated."""

    def test_resolved_beats_outdated(self):
        thread = ReviewThread(
            thread_id="PRRT_x",
            path="a.rs",
            line=1,
            original_line=1,
            is_resolved=True,
            is_outdated=True,
            resolved_by="admin",
            diff_hunk="",
            comments=[],
        )
        result = classify_threads([thread])
        self.assertEqual(result[0].status, Status.RESOLVED)


if __name__ == "__main__":
    unittest.main()
