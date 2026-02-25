# PR Explainer

Generate diagram-rich, interactive HTML PR review pages. Output is a single self-contained HTML file with mermaid.js (CDN), embedded CSS/JS — no build step.

Focus on **understanding without reading code**: flowcharts, state machines, sequence diagrams, before/after cards, and ASCII art.

## Features

- **Mermaid diagrams** — Flowcharts, state machines, sequence diagrams with dark theme
- **Before/After cards** — Old pain vs new behavior at a glance
- **ASCII art** — Schema diagrams, file structures, config shapes
- **Callouts** — Key design decisions highlighted
- **File table** — All changed files with status, +/-, and purpose
- **Dark UI** — Professional dark theme with sticky nav and scroll highlights
- **Single file** — Zero dependencies, opens in any browser

## Usage

### With Claude Code

```
Review this PR and generate an interactive HTML explainer
```

The skill will:
1. Gather PR data (commits, diff stats, file changes)
2. Design mermaid diagrams for each logical feature
3. Generate a self-contained HTML file

### With the generator script

```bash
node scripts/generate-pr-explainer.js --data pr-data.json --output pr-review.html
```

Or pipe JSON via stdin:

```bash
cat pr-data.json | node scripts/generate-pr-explainer.js --output pr-review.html
```

## Input JSON Schema

```json
{
  "title": "PR Title",
  "subtitle": "One-line description",
  "status": "merged|open|draft",
  "commits": [{ "sha": "abc1234", "message": "feat: something" }],
  "stats": { "files": 5, "insertions": 200, "deletions": 50, "tests": 42 },
  "sections": [{
    "id": "section-id",
    "title": "Section Name",
    "icon": "🔄",
    "color": "coral|green|indigo|red",
    "subtitle": "What this section covers",
    "diagrams": [{
      "title": "Diagram Name",
      "description": "What this shows",
      "mermaid": "sequenceDiagram\n  A->>B: message"
    }],
    "beforeAfter": { "before": "Old pain", "after": "New behavior" },
    "callouts": [{ "text": "Key insight", "color": "coral" }],
    "ascii": "optional ASCII art"
  }],
  "files": [{
    "name": "path/file.tsx",
    "status": "new|modified",
    "additions": 10,
    "deletions": 5,
    "purpose": "short description"
  }],
  "reviewNotes": ["All tests pass"]
}
```

## Installation

### Claude Code Marketplace

```bash
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install pr-explainer@firat-claude-plugins
```

### Manual

```bash
git clone https://github.com/serrrfirat/firat-claude-plugins.git
claude --plugin-dir ./firat-claude-plugins/skills/development/pr-explainer
```

## Tests

```bash
node scripts/generate-pr-explainer.test.js
```

64 tests covering all generator functions, HTML structure, XSS prevention, and integration.

## License

MIT
