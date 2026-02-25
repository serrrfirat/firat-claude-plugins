---
name: pr-explainer
description: Generate interactive single-file HTML websites that explain PR changes with mermaid diagrams, state machines, sequence flows, before/after comparisons, ASCII art, and dark-themed UI. Use when reviewing PRs, creating PR documentation, or explaining code changes visually.
---

# PR Explainer

Generate diagram-rich, interactive HTML PR review pages. Output is a single self-contained HTML file with mermaid.js (CDN), embedded CSS/JS — no build step. Focus on **understanding without reading code**: flowcharts, state machines, sequence diagrams, before/after cards, and ASCII art.

## When to Use

- After completing a PR, to create a visual walkthrough
- To document complex PRs for team review
- When asked to "explain this PR" or "create a PR review page"
- To generate interactive changelogs for releases

## Workflow

### Step 1: Gather PR Data

```bash
git log --oneline <base>..<head>
git diff --stat <base>..<head>
git diff <base>..<head> -- <file>    # per-file for narratives
```

Required: commit SHAs/messages, files changed with +/- counts, test/lint status.

### Step 2: Design Diagrams (THE KEY STEP)

For each logical feature, ask: "What diagram would let someone understand this **without reading code**?"

| Change Type | Best Diagram |
|-------------|-------------|
| New user flow | `sequenceDiagram` — show actor interactions |
| State lifecycle | `stateDiagram-v2` — show transitions + triggers |
| Data/control flow | `flowchart` — show decision points + paths |
| Architecture change | `flowchart` with subgraphs — before/after layers |
| Config/schema change | ASCII art box diagram |

Also create **Before/After cards** for each feature — one sentence each showing the old pain vs new behavior.

### Step 3: Organize into Sections

Group changes into 3-6 sections. Each section gets:
- A mermaid diagram (or multiple)
- A before/after comparison
- Optional callout with key design decisions
- Optional ASCII art for schemas/file structures

### Step 4: Generate HTML

```bash
node scripts/generate-pr-explainer.js --data pr-data.json --output pr-review.html
```

Or construct HTML directly from `references/html-template.md`.

### Step 5: Verify

Open in browser. Check: mermaid diagrams render, nav highlights on scroll, before/after cards readable, file table complete.

## Input JSON Schema

```json
{
  "title": "string", "subtitle": "string",
  "status": "merged|open|draft",
  "commits": [{ "sha": "string", "message": "string" }],
  "stats": { "files": 0, "insertions": 0, "deletions": 0, "tests": 0 },
  "sections": [{
    "id": "nav-anchor", "title": "Section Name",
    "icon": "emoji", "color": "coral|green|indigo|red",
    "subtitle": "One-line description",
    "diagrams": [{
      "title": "Diagram Name",
      "description": "What this diagram shows",
      "mermaid": "sequenceDiagram\n  A->>B: message"
    }],
    "beforeAfter": { "before": "Old pain", "after": "New behavior" },
    "callouts": [{ "text": "Key insight", "color": "coral" }],
    "ascii": "optional raw ASCII art"
  }],
  "files": [{
    "name": "path/file.tsx", "status": "new|modified",
    "additions": 0, "deletions": 0, "purpose": "short description"
  }],
  "reviewNotes": ["All tests pass: 526/526"]
}
```

## Design Tokens

See `references/html-template.md` for full CSS. High-contrast mono + red (#ef4444) palette:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#000` | Pure black background |
| `--surface` | `#09090b` | Cards, panels |
| `--coral` | `#ef4444` | Red pop accent |
| `--green` | `#4ade80` | Additions/success |
| `--text` | `#fafafa` | Primary white text |
| `--text3` | `#888` | Muted gray |

## Resources

- `scripts/generate-pr-explainer.js` — Generates HTML from PR data JSON
- `scripts/generate-pr-explainer.test.js` — Tests for the generator
- `references/html-template.md` — Component patterns, CSS, mermaid config

## Tips

- **Diagrams > prose.** If you can draw it, don't write it
- Before/After cards are the fastest way to communicate "why this matters"
- Callouts for non-obvious design decisions ("Why Canvas 2D over WebGL?")
- ASCII art for file structures, schemas, config shapes
- Keep the file table compact — name, status, +/-, one-line purpose
