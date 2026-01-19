# Video to Code

A Claude Code plugin that converts video animations, GIFs, and interactive demos into production-ready React components using AI-powered frame-by-frame analysis.

## Features

- **Video Analysis**: Uses Google Gemini 2.5 Flash to analyze animations frame-by-frame
- **Smart Download**: Handles authenticated URLs (Cloudflare R2, signed URLs) via Puppeteer
- **Animation Lab**: Interactive preview environment for real-time iteration
- **Feedback Loop**: Structured feedback collection to refine animations until perfect
- **Framework Support**: Works with Next.js (App Router & Pages Router) and Vite

## Installation

### 1. Clone the plugin

```bash
git clone https://github.com/serrrfirat/claude-video-to-code.git
```

### 2. Load the plugin in Claude Code

```bash
claude --plugin-dir /path/to/claude-video-to-code
```

Or add to your Claude Code settings for persistent use.

### 3. Set up Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API key"
3. Add to your shell config (`~/.zshrc` or `~/.bashrc`):

```bash
export GEMINI_API_KEY="your-api-key-here"
```

4. Restart your terminal and Claude Code

### 4. Install dependencies (optional)

Run the setup script to pre-install dependencies:

```bash
cd /path/to/claude-video-to-code
./scripts/setup.sh
```

## Plugin Structure

```
video-to-code/
├── .claude-plugin/
│   └── plugin.json         # Plugin manifest
├── commands/
│   └── convert.md          # /video-to-code:convert command
├── skills/
│   └── video-to-code/
│       └── SKILL.md        # Agent skill for video conversion
├── scripts/
│   ├── download-video.mjs  # Puppeteer video downloader
│   ├── analyze-video.mjs   # Gemini video analyzer
│   └── setup.sh            # Dependency installer
└── README.md
```

## Usage

### Slash Command

```
/video-to-code:convert https://example.com/page-with-animation
```

### Natural Language

Just describe what you want:

- "Convert this video animation to React code"
- "Replicate this interaction from the video"
- "Build this GIF animation in React"
- "Implement this motion effect"

### Standalone Scripts

You can also run the scripts directly:

```bash
# Download video from authenticated URL
node scripts/download-video.mjs "https://example.com/page" /tmp/animation.mp4

# Analyze video with Gemini
node scripts/analyze-video.mjs /tmp/animation.mp4 /tmp/spec.md
```

## How It Works

1. **Download**: Fetches the video (uses Puppeteer for authenticated URLs)
2. **Analyze**: Sends to Gemini 2.5 Flash for detailed motion analysis
3. **Generate**: Creates a React component in Animation Lab
4. **Preview**: You review at `/__animation_lab` route
5. **Iterate**: Provide feedback, Claude adjusts until perfect
6. **Export**: Final component saved to your preferred location

## Animation Lab

The plugin creates a temporary preview environment:

```
.claude-animation/
├── lab/
│   └── Animation.tsx       # Current implementation
├── gemini-spec.md          # Raw Gemini analysis
└── iteration-log.md        # Changes across iterations
```

Preview at `http://localhost:[PORT]/__animation_lab`

## Common Adjustments

| Issue | Solution |
|-------|----------|
| Too stiff | Lower `stiffness`, increase `damping` |
| Too bouncy | Increase `damping`, lower `mass` |
| Too slow | Increase `stiffness` |
| Too fast | Lower `stiffness`, increase `mass` |
| Not enough movement | Increase rotation/movement multiplier |
| Too much movement | Decrease rotation/movement multiplier |

## Requirements

- Claude Code CLI
- Node.js 18+
- Google Gemini API key
- React project (Next.js or Vite recommended)
- `framer-motion` for most animations

## Development

Test changes locally:

```bash
claude --plugin-dir ./claude-video-to-code
```

Restart Claude Code to pick up changes after editing plugin files.

## License

MIT
