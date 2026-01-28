# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a collection of Claude Code plugins (skills) for AI-powered development workflows. The repository serves as a marketplace that can be added to Claude Code for plugin discovery and installation.

## Repository Structure

```
firat-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json    # Plugin registry for marketplace
├── skills/
│   ├── animation/
│   │   └── video-to-code/  # Convert videos/GIFs to React components
│   └── tools/
│       └── last30days/     # Research topics across Reddit, X, and web
├── AGENTS.md               # Universal skill discovery for AI agents
└── README.md               # User-facing documentation
```

## Plugin Structure

Each plugin follows this structure:
```
skills/<category>/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json         # Plugin metadata and configuration
├── skills/
│   └── <plugin-name>/
│       └── SKILL.md        # Skill definition and instructions
├── commands/               # Optional slash commands
│   └── <command>.md
└── README.md               # Plugin documentation
```

## Available Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| video-to-code | animation | Convert video animations and GIFs into React components using Gemini 2.5 Flash |
| last30days | tools | Research topics from the last 30 days across Reddit, X, and the web |

## Key Files

- **marketplace.json**: Defines plugins available for installation via `/plugin install`
- **AGENTS.md**: Universal discovery file for AI agents (cross-platform compatibility)
- **SKILL.md**: Contains the actual skill instructions that Claude Code loads

## Development Guidelines

### Adding a New Plugin

1. Create directory: `skills/<category>/<plugin-name>/`
2. Add `plugin.json` in `.claude-plugin/` with metadata
3. Create `SKILL.md` in `skills/<plugin-name>/` with instructions
4. Optionally add commands in `commands/` directory
5. Update root `marketplace.json` to register the plugin
6. Update `AGENTS.md` with plugin details

### Marketplace JSON Schema

Plugins in `marketplace.json` require:
- `name`: Plugin identifier
- `description`: Short description
- `category`: One of: development, productivity, animation, tools, workflow
- `source`: Path to plugin directory (use `./` prefix)
- `version`: Semantic version

### Installation Methods

Users can install plugins via:
```bash
# Claude Code marketplace
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install <plugin-name>@firat-claude-plugins

# Manual
claude --plugin-dir ./skills/<category>/<plugin-name>

# OpenSkills (cross-platform)
openskills install serrrfirat/firat-claude-plugins
```

## Common Commands

```bash
# Test a plugin locally
claude --plugin-dir ./skills/animation/video-to-code

# Validate marketplace.json
cat .claude-plugin/marketplace.json | jq .
```
