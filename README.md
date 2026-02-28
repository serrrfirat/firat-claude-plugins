# Firat's Claude Plugins

A curated collection of Claude Code skills for AI-powered development workflows.

## Skills

### Animation
| Skill | Description |
|-------|-------------|
| [video-to-code](skills/animation/video-to-code) | Convert video animations and GIFs into React components |

### Development
| Skill | Description |
|-------|-------------|
| [pr-explainer](skills/development/pr-explainer) | Generate interactive HTML PR reviews with mermaid diagrams, scroll-linked motion, and high-contrast mono+red design |
| [paranoid-pr-review](skills/development/paranoid-pr-review) | Paranoid architect PR review across 6 lenses — posts findings as GitHub comments |
| [pr-feedback-audit](skills/development/pr-feedback-audit) | Audit GitHub PR review threads to verify all feedback was addressed |
| [review-dashboard](skills/development/review-dashboard) | Scan open PRs you reviewed, deep-audit each with two-layer strategy, take actions with draft-first confirmation |

### Tools
| Skill | Description |
|-------|-------------|
| [last30days](skills/tools/last30days) | Research any topic from the last 30 days across Reddit, X, and the web |

## Installation

### Claude Code (Recommended)

```bash
# Add the marketplace
/plugin marketplace add serrrfirat/firat-claude-plugins

# Install a specific skill
/plugin install video-to-code@firat-claude-plugins
```

### Manual Installation

```bash
# Clone the repo
git clone https://github.com/serrrfirat/firat-claude-plugins.git

# Load a specific skill
claude --plugin-dir ./firat-claude-plugins/skills/animation/video-to-code
```

### OpenSkills (Cross-platform)

Works with Claude Code, Cursor, Windsurf, Cline, and other AI agents:

```bash
npm i -g openskills
openskills install serrrfirat/firat-claude-plugins
openskills sync
```

## Structure

```
firat-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json       # Skill registry
├── skills/
│   ├── animation/
│   │   └── video-to-code/     # Video-to-React conversion
│   ├── development/
│   │   ├── pr-explainer/      # Interactive PR review pages
│   │   ├── paranoid-pr-review/ # Architect-level code review
│   │   ├── pr-feedback-audit/ # PR review thread auditor
│   │   └── review-dashboard/ # PR review dashboard & actions
│   ├── tools/
│   │   └── last30days/        # Topic research tool
│   └── workflow/              # Development workflows
└── AGENTS.md                  # Universal discovery file
```

## Categories

- **animation** - UI animations and motion effects
- **tools** - CLI utilities and helpers
- **workflow** - Development process automation
- **development** - Code generation and review

## Contributing

1. Fork this repository
2. Create your skill in the appropriate category: `skills/<category>/<skill-name>/`
3. Follow the structure:
   ```
   skills/<category>/<skill-name>/
   ├── .claude-plugin/
   │   └── plugin.json
   ├── skills/
   │   └── <skill-name>/
   │       └── SKILL.md
   ├── commands/           # Optional
   └── README.md
   ```
4. Update `.claude-plugin/marketplace.json`
5. Submit a pull request

## License

MIT
