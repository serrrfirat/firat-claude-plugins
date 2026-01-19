# Firat's Claude Plugins

A curated collection of Claude Code skills for AI-powered development workflows.

## Skills

### Animation
| Skill | Description |
|-------|-------------|
| [video-to-code](skills/animation/video-to-code) | Convert video animations and GIFs into React components |

## Installation

```bash
# Clone the repo
git clone https://github.com/serrrfirat/firat-claude-plugins.git

# Load a specific skill
claude --plugin-dir ./firat-claude-plugins/skills/animation/video-to-code

# Or load all skills in a category
claude --plugin-dir ./firat-claude-plugins/skills/animation
```

## Structure

```
firat-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json       # Skill registry
├── skills/
│   ├── animation/
│   │   └── video-to-code/     # Video-to-React conversion
│   ├── tools/                 # CLI tools & utilities
│   ├── workflow/              # Development workflows
│   └── development/           # Code generation & review
└── docs/
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
