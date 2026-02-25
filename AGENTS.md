# Firat's Claude Plugins

> Universal skill discovery file for AI agents

## Available Skills

### video-to-code
- **Category:** animation
- **Path:** `skills/animation/video-to-code`
- **Description:** Convert video animations and GIFs into React components using AI-powered frame-by-frame analysis
- **Tags:** animation, react, video, gemini, framer-motion

**Capabilities:**
- Download videos from authenticated URLs (Cloudflare R2, signed URLs)
- Analyze animations frame-by-frame with Gemini 2.5 Flash
- Generate React components with framer-motion
- Interactive preview environment (Animation Lab)
- Iterative feedback loop until perfect match

**Requirements:**
- GEMINI_API_KEY environment variable
- Node.js 18+
- React project (Next.js or Vite)

---

### last30days
- **Category:** tools
- **Path:** `skills/tools/last30days`
- **Description:** Research any topic from the last 30 days across Reddit, X, and the web. Surface community insights, engagement metrics, and write copy-paste-ready prompts.
- **Tags:** research, reddit, twitter, prompts, trending, discovery

**Capabilities:**
- Multi-source research across Reddit, X (Twitter), and the web
- Real engagement metrics (upvotes, likes, reposts) for ranking
- Intelligent synthesis weighted by community engagement
- Copy-paste-ready prompt generation in the format communities recommend
- Flexible modes: Full (both APIs), Partial (one API), Web-only (no APIs)
- Query types: Prompting, Recommendations, News, General

**Requirements:**
- Python 3.8+
- OPENAI_API_KEY (optional, for Reddit research)
- XAI_API_KEY (optional, for X research)
- Works without any API keys using WebSearch fallback

---

### pr-explainer
- **Category:** development
- **Path:** `skills/development/pr-explainer`
- **Description:** Generate interactive HTML PR reviews with mermaid diagrams, state machines, sequence flows, before/after cards, and ASCII art
- **Tags:** pr-review, mermaid, diagrams, html, code-review, documentation

**Capabilities:**
- Generate single self-contained HTML file from PR data
- Mermaid.js diagrams: flowcharts, state machines, sequence diagrams
- Before/After comparison cards for each feature
- ASCII art for schemas, file structures, config shapes
- Dark theme UI with sticky nav and scroll-to-top
- File change table with status, additions/deletions, purpose
- XSS-safe HTML escaping

**Requirements:**
- Node.js 18+

---

## Installation

### Claude Code
```bash
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install video-to-code@firat-claude-plugins
```

### Manual
```bash
git clone https://github.com/serrrfirat/firat-claude-plugins.git
claude --plugin-dir ./firat-claude-plugins/skills/animation/video-to-code
```

### OpenSkills (Cross-platform)
```bash
npm i -g openskills
openskills install serrrfirat/firat-claude-plugins
openskills sync
```

---

## Registry

- **Owner:** Firat Sertgoz (@serrrfirat)
- **Repository:** https://github.com/serrrfirat/firat-claude-plugins
- **License:** MIT
