# Firat's Claude Plugins

A curated collection of Claude Code plugins for AI-powered development workflows.

## Available Plugins

| Plugin | Description | Tags |
|--------|-------------|------|
| [video-to-code](plugins/video-to-code) | Convert video animations and GIFs into React components | animation, react, video, gemini |

## Installation

### Install a Single Plugin

```bash
# Clone the repo
git clone https://github.com/serrrfirat/firat-claude-plugins.git

# Load a specific plugin
claude --plugin-dir ./firat-claude-plugins/plugins/video-to-code
```

### Install All Plugins

```bash
# Load all plugins
claude --plugin-dir ./firat-claude-plugins
```

## Plugin Categories

### Animation & UI
- **video-to-code** - AI-powered video-to-React conversion using Gemini 2.5 Flash

## Contributing

### Adding a New Plugin

1. Fork this repository
2. Create your plugin in `plugins/your-plugin-name/`
3. Follow the standard structure:
   ```
   plugins/your-plugin/
   ├── .claude-plugin/
   │   └── plugin.json      # Required: Plugin manifest
   ├── commands/            # Slash commands
   ├── skills/              # Agent skills
   └── README.md
   ```
4. Update `.claude-plugin/marketplace.json` to register your plugin
5. Submit a pull request

### Plugin Requirements

- Must have a valid `.claude-plugin/plugin.json` manifest
- Must include a README.md with usage instructions
- Should follow Claude Code plugin best practices

## Plugin Development

See the [Plugin Development Guide](docs/plugin-development.md) for detailed instructions on creating plugins.

## License

MIT - Individual plugins may have their own licenses.
