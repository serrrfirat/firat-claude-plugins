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
