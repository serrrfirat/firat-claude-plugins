#!/usr/bin/env node
/**
 * Tests for generate-pr-explainer.js (diagram-centric version)
 *
 * Run: node generate-pr-explainer.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  parseArgs,
  validateData,
  escapeHtml,
  generateHtml,
  generateNav,
  generateHeader,
  generateStats,
  generateSections,
  generateFileTable,
  generateReviewNotes,
} = require("./generate-pr-explainer");

const SAMPLE_DATA = {
  title: "Test PR Title",
  subtitle: "A test subtitle for the PR",
  status: "merged",
  commits: [
    { sha: "abc1234", message: "fix: first commit" },
    { sha: "def5678", message: "feat: second commit" },
  ],
  stats: { files: 3, insertions: 100, deletions: 20, tests: 42 },
  sections: [
    {
      id: "retry",
      title: "Stream Retry",
      icon: "🔄",
      color: "coral",
      subtitle: "Retry when streams break",
      diagrams: [
        {
          title: "Retry Sequence",
          description: "What happens when a stream dies",
          mermaid: "sequenceDiagram\n  User->>App: Send message\n  App--xUser: Stream dies",
        },
      ],
      beforeAfter: {
        before: "User stuck with dead stream",
        after: "Retry button appears automatically",
      },
      callouts: [
        { text: "<strong>Key:</strong> Reuses existing send flow", color: "coral" },
      ],
      ascii: "  [User] --> [ChatArea] --> [AI Stream]",
    },
    {
      id: "auth",
      title: "Auth Retry",
      icon: "🔑",
      color: "green",
      subtitle: "Auto-retry after re-auth",
      diagrams: [
        {
          title: "Auth State Machine",
          description: "Capture-replay buffer",
          mermaid: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Failed : auth error",
        },
      ],
      beforeAfter: null,
      callouts: [],
      ascii: null,
    },
  ],
  files: [
    { name: "ChatArea.tsx", status: "modified", additions: 26, deletions: 7, purpose: "Retry wiring" },
    { name: "LetterGlitch.tsx", status: "new", additions: 268, deletions: 0, purpose: "Canvas effect" },
    { name: "store.ts", status: "modified", additions: 50, deletions: 10, purpose: "Auth retry state" },
  ],
  reviewNotes: ["All tests pass: 42/42", "TypeScript clean", "No as any"],
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log("generate-pr-explainer tests (diagram-centric)\n");

// --- parseArgs ---
console.log("parseArgs:");

test("parses --data flag", () => {
  const args = parseArgs(["node", "script", "--data", "input.json"]);
  assert.strictEqual(args.data, "input.json");
});

test("parses --output flag", () => {
  const args = parseArgs(["node", "script", "--output", "out.html"]);
  assert.strictEqual(args.output, "out.html");
});

test("parses --title flag", () => {
  const args = parseArgs(["node", "script", "--title", "My PR"]);
  assert.strictEqual(args.title, "My PR");
});

test("defaults output to pr-review.html", () => {
  const args = parseArgs(["node", "script"]);
  assert.strictEqual(args.output, "pr-review.html");
});

test("parses all flags together", () => {
  const args = parseArgs(["node", "script", "--data", "d.json", "--title", "T", "--output", "o.html"]);
  assert.strictEqual(args.data, "d.json");
  assert.strictEqual(args.title, "T");
  assert.strictEqual(args.output, "o.html");
});

// --- validateData ---
console.log("\nvalidateData:");

test("valid data returns no errors", () => {
  assert.strictEqual(validateData(SAMPLE_DATA).length, 0);
});

test("missing title reports error", () => {
  const errors = validateData({ ...SAMPLE_DATA, title: "" });
  assert.ok(errors.some((e) => e.includes("title")));
});

test("missing stats reports error", () => {
  const errors = validateData({ ...SAMPLE_DATA, stats: undefined });
  assert.ok(errors.some((e) => e.includes("stats")));
});

test("empty sections array reports error", () => {
  const errors = validateData({ ...SAMPLE_DATA, sections: [] });
  assert.ok(errors.some((e) => e.includes("sections")));
});

test("empty files array reports error", () => {
  const errors = validateData({ ...SAMPLE_DATA, files: [] });
  assert.ok(errors.some((e) => e.includes("files")));
});

test("non-numeric stats reports error", () => {
  const data = { ...SAMPLE_DATA, stats: { files: "three", insertions: 0, deletions: 0 } };
  const errors = validateData(data);
  assert.ok(errors.some((e) => e.includes("stats.files")));
});

// --- escapeHtml ---
console.log("\nescapeHtml:");

test("escapes angle brackets", () => {
  assert.strictEqual(escapeHtml("<div>"), "&lt;div&gt;");
});

test("escapes ampersands", () => {
  assert.strictEqual(escapeHtml("a & b"), "a &amp; b");
});

test("escapes quotes", () => {
  assert.strictEqual(escapeHtml('"hello"'), "&quot;hello&quot;");
});

test("handles non-string input", () => {
  assert.strictEqual(escapeHtml(42), "42");
});

// --- generateNav ---
console.log("\ngenerateNav:");

test("includes overview link", () => {
  const html = generateNav(SAMPLE_DATA);
  assert.ok(html.includes('href="#overview"'));
});

test("includes section links from data", () => {
  const html = generateNav(SAMPLE_DATA);
  assert.ok(html.includes('href="#retry"'));
  assert.ok(html.includes('href="#auth"'));
  assert.ok(html.includes("Stream Retry"));
  assert.ok(html.includes("Auth Retry"));
});

test("includes files link", () => {
  const html = generateNav(SAMPLE_DATA);
  assert.ok(html.includes('href="#files"'));
});

test("includes review link when reviewNotes present", () => {
  const html = generateNav(SAMPLE_DATA);
  assert.ok(html.includes('href="#review"'));
});

test("omits review link when no reviewNotes", () => {
  const html = generateNav({ ...SAMPLE_DATA, reviewNotes: [] });
  assert.ok(!html.includes('href="#review"'));
});

// --- generateHeader ---
console.log("\ngenerateHeader:");

test("shows merged status", () => {
  const html = generateHeader(SAMPLE_DATA);
  assert.ok(html.includes("Merged"));
});

test("shows open status", () => {
  const html = generateHeader({ ...SAMPLE_DATA, status: "open" });
  assert.ok(html.includes("Open"));
});

test("shows draft status", () => {
  const html = generateHeader({ ...SAMPLE_DATA, status: "draft" });
  assert.ok(html.includes("Draft"));
});

test("includes title", () => {
  const html = generateHeader(SAMPLE_DATA);
  assert.ok(html.includes("Test PR Title"));
});

test("includes subtitle", () => {
  const html = generateHeader(SAMPLE_DATA);
  assert.ok(html.includes("A test subtitle"));
});

test("includes commit SHAs", () => {
  const html = generateHeader(SAMPLE_DATA);
  assert.ok(html.includes("abc1234"));
  assert.ok(html.includes("def5678"));
});

test("has overview id", () => {
  const html = generateHeader(SAMPLE_DATA);
  assert.ok(html.includes('id="overview"'));
});

// --- generateStats ---
console.log("\ngenerateStats:");

test("shows all stat values", () => {
  const html = generateStats(SAMPLE_DATA);
  assert.ok(html.includes(">3<"));
  assert.ok(html.includes("+100"));
  assert.ok(html.includes("-20"));
  assert.ok(html.includes(">42<"));
});

test("omits tests when not provided", () => {
  const data = { ...SAMPLE_DATA, stats: { files: 1, insertions: 1, deletions: 1 } };
  const html = generateStats(data);
  assert.ok(!html.includes("Tests Passing"));
});

// --- generateSections ---
console.log("\ngenerateSections:");

test("renders section ids", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes('id="retry"'));
  assert.ok(html.includes('id="auth"'));
});

test("renders section titles with icons", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("🔄"));
  assert.ok(html.includes("Stream Retry"));
  assert.ok(html.includes("🔑"));
  assert.ok(html.includes("Auth Retry"));
});

test("renders subtitles", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("Retry when streams break"));
});

test("renders mermaid diagrams in pre tags", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes('class="mermaid"'));
  assert.ok(html.includes("sequenceDiagram"));
  assert.ok(html.includes("stateDiagram-v2"));
});

test("renders diagram titles and descriptions", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("Retry Sequence"));
  assert.ok(html.includes("What happens when a stream dies"));
});

test("renders before/after cards", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("before-after"));
  assert.ok(html.includes("User stuck with dead stream"));
  assert.ok(html.includes("Retry button appears automatically"));
});

test("skips before/after when null", () => {
  const html = generateSections({
    ...SAMPLE_DATA,
    sections: [SAMPLE_DATA.sections[1]], // auth section has null beforeAfter
  });
  assert.ok(!html.includes("before-after"));
});

test("renders callouts", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("callout"));
  assert.ok(html.includes("Reuses existing send flow"));
});

test("skips callouts when empty", () => {
  const html = generateSections({
    ...SAMPLE_DATA,
    sections: [SAMPLE_DATA.sections[1]], // auth section has empty callouts
  });
  assert.ok(!html.includes("callout"));
});

test("renders ASCII boxes", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("ascii-box"));
  assert.ok(html.includes("[User] --> [ChatArea] --> [AI Stream]"));
});

test("skips ASCII when null", () => {
  const html = generateSections({
    ...SAMPLE_DATA,
    sections: [SAMPLE_DATA.sections[1]], // auth section has null ascii
  });
  assert.ok(!html.includes("ascii-box"));
});

test("applies correct color variables", () => {
  const html = generateSections(SAMPLE_DATA);
  assert.ok(html.includes("--coral"));
  assert.ok(html.includes("--green"));
});

// --- generateFileTable ---
console.log("\ngenerateFileTable:");

test("renders file table with all files", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("ChatArea.tsx"));
  assert.ok(html.includes("LetterGlitch.tsx"));
  assert.ok(html.includes("store.ts"));
});

test("marks new files with NEW tag", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("tag-new"));
});

test("marks modified files with MOD tag", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("tag-mod"));
});

test("shows addition/deletion counts", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("+26"));
  assert.ok(html.includes("-7"));
  assert.ok(html.includes("+268"));
});

test("shows purpose column", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("Retry wiring"));
  assert.ok(html.includes("Canvas effect"));
});

test("has files section id", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes('id="files"'));
});

test("shows commit count in subtitle", () => {
  const html = generateFileTable(SAMPLE_DATA);
  assert.ok(html.includes("2 commits"));
});

// --- generateReviewNotes ---
console.log("\ngenerateReviewNotes:");

test("returns empty for no notes", () => {
  assert.strictEqual(generateReviewNotes({ reviewNotes: [] }), "");
});

test("includes all notes", () => {
  const html = generateReviewNotes(SAMPLE_DATA);
  assert.ok(html.includes("All tests pass: 42/42"));
  assert.ok(html.includes("TypeScript clean"));
  assert.ok(html.includes("No as any"));
});

test("has review section id", () => {
  const html = generateReviewNotes(SAMPLE_DATA);
  assert.ok(html.includes('id="review"'));
});

test("renders check icons", () => {
  const html = generateReviewNotes(SAMPLE_DATA);
  assert.ok(html.includes("check-icon"));
});

// --- generateHtml (full assembly) ---
console.log("\ngenerateHtml:");

test("produces valid HTML document", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.startsWith("<!DOCTYPE html>"));
  assert.ok(html.includes("</html>"));
});

test("includes title in <title> tag", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("<title>PR Review — Test PR Title</title>"));
});

test("includes mermaid CDN import", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("cdn.jsdelivr.net/npm/mermaid@11"));
});

test("includes mermaid dark theme config", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("theme: 'dark'"));
  assert.ok(html.includes("darkMode: true"));
});

test("includes CSS variables", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("--bg:#181818"));
  assert.ok(html.includes("--coral:#DC9F85"));
});

test("includes IntersectionObserver JS", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("IntersectionObserver"));
});

test("includes scroll-to-top button", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("scroll-top"));
  assert.ok(html.includes("scrollTop"));
});

test("uses container layout not app grid", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("container"));
  assert.ok(!html.includes('"app"'));
});

test("includes nav element", () => {
  const html = generateHtml(SAMPLE_DATA);
  assert.ok(html.includes("<nav>"));
});

test("XSS prevention in title", () => {
  const data = { ...SAMPLE_DATA, title: '<script>alert("xss")</script>' };
  const html = generateHtml(data);
  assert.ok(!html.includes('<script>alert("xss")</script>'));
  assert.ok(html.includes("&lt;script&gt;"));
});

// --- Integration: write to disk ---
console.log("\nIntegration:");

test("generates valid HTML file to disk", () => {
  const tmpPath = path.join(__dirname, "_test_output.html");
  try {
    const html = generateHtml(SAMPLE_DATA);
    fs.writeFileSync(tmpPath, html, "utf8");
    const read = fs.readFileSync(tmpPath, "utf8");
    assert.ok(read.includes("<!DOCTYPE html>"));
    assert.ok(read.length > 5000);
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});

test("output includes all major components", () => {
  const html = generateHtml(SAMPLE_DATA);
  // Nav
  assert.ok(html.includes("<nav>"), "missing nav");
  // Header
  assert.ok(html.includes('id="overview"'), "missing overview");
  // Stats
  assert.ok(html.includes("stat s1"), "missing stats");
  // Mermaid diagrams
  assert.ok(html.includes('class="mermaid"'), "missing mermaid");
  // Before/after
  assert.ok(html.includes("before-after"), "missing before/after");
  // Callout
  assert.ok(html.includes("callout"), "missing callout");
  // ASCII box
  assert.ok(html.includes("ascii-box"), "missing ascii");
  // File table
  assert.ok(html.includes("file-table"), "missing file table");
  // Review notes
  assert.ok(html.includes("check-list"), "missing review notes");
  // Scroll top
  assert.ok(html.includes("scroll-top"), "missing scroll top");
});

// --- Summary ---
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
