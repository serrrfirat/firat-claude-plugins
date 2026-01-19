# Plugin Development Guide

Learn how to create Claude Code plugins for this marketplace.

## Quick Start

1. Create your plugin directory:
   ```bash
   mkdir -p plugins/my-plugin/{.claude-plugin,commands,skills}
   ```

2. Create the plugin manifest:
   ```json
   // plugins/my-plugin/.claude-plugin/plugin.json
   {
     "name": "my-plugin",
     "description": "What your plugin does",
     "version": "1.0.0",
     "author": {
       "name": "Your Name"
     }
   }
   ```

3. Add commands or skills (see below)

4. Register in marketplace.json

## Plugin Structure

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json         # Required: Plugin manifest
├── commands/               # Optional: Slash commands
│   ├── command1.md
│   └── command2.md
├── skills/                 # Optional: Agent skills
│   └── skill-name/
│       └── SKILL.md
├── scripts/               # Optional: Helper scripts
├── hooks/                 # Optional: Event handlers
│   └── hooks.json
└── README.md              # Required: Documentation
```

## Plugin Manifest

The `.claude-plugin/plugin.json` file defines your plugin:

```json
{
  "name": "my-plugin",
  "description": "A brief description",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "github": "username"
  },
  "repository": "https://github.com/username/repo",
  "license": "MIT",
  "keywords": ["tag1", "tag2"]
}
```

## Slash Commands

Commands are Markdown files in `commands/`. The filename becomes the command name.

**Example: `commands/greet.md`**
```markdown
---
description: Greet someone warmly
---

# Greet Command

Say hello to "$ARGUMENTS" in a friendly way.
```

**Usage:** `/my-plugin:greet World`

### Command Variables
- `$ARGUMENTS` - All text after the command
- `$1`, `$2`, etc. - Individual arguments

## Agent Skills

Skills are automatically invoked by Claude based on context.

**Example: `skills/code-review/SKILL.md`**
```markdown
---
name: code-review
description: Reviews code for best practices. Use when reviewing PRs or analyzing code quality.
---

When reviewing code, check for:
1. Code organization
2. Error handling
3. Security concerns
4. Performance issues
```

## Hooks

React to Claude Code events with `hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix $FILE"
          }
        ]
      }
    ]
  }
}
```

### Available Hooks
- `PreToolUse` - Before a tool runs
- `PostToolUse` - After a tool completes
- `Notification` - On status changes

## Testing Your Plugin

```bash
# Test locally
claude --plugin-dir ./plugins/my-plugin

# Test with marketplace
claude --plugin-dir ./claude-plugins-marketplace
```

## Registering Your Plugin

Add to `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "description": "What it does",
      "path": "plugins/my-plugin",
      "version": "1.0.0",
      "tags": ["category", "keywords"]
    }
  ]
}
```

## Best Practices

1. **Clear descriptions** - Help users understand what your plugin does
2. **Good defaults** - Work out of the box with minimal configuration
3. **Error handling** - Gracefully handle missing dependencies or invalid input
4. **Documentation** - Include a README with usage examples
5. **Versioning** - Use semantic versioning (major.minor.patch)

## Examples

See existing plugins in this marketplace:
- [video-to-code](../plugins/video-to-code) - Video animation to React conversion
