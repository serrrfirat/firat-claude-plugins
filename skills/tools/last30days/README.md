# /last30days

**The AI world reinvents itself every month. This Claude Code skill keeps you current.** /last30days researches your topic across Reddit, X, and the web from the last 30 days, finds what the community is actually upvoting and sharing, and writes you a prompt that works today, not six months ago.

**Best for prompt research**: discover what prompting techniques actually work for any tool (ChatGPT, Midjourney, Claude, Figma AI, etc.) by learning from real community discussions and best practices.

**But also great for anything trending**: music, culture, news, product recommendations, viral trends, or any question where "what are people saying right now?" matters.

## Features

- **Multi-source research** - Scans Reddit, X (Twitter), and the web simultaneously
- **Engagement metrics** - Surfaces content by upvotes, likes, and reposts (not just relevance)
- **Prompt generation** - Writes copy-paste-ready prompts in the format the community recommends
- **Flexible modes** - Works with API keys (full mode) or without (web-only fallback)
- **Smart synthesis** - Identifies patterns across all sources, weighted by engagement

## Installation

### Claude Code Marketplace
```bash
/plugin marketplace add serrrfirat/firat-claude-plugins
/plugin install last30days@firat-claude-plugins
```

### Manual Installation
```bash
git clone https://github.com/serrrfirat/firat-claude-plugins.git
claude --plugin-dir ./firat-claude-plugins/skills/tools/last30days
```

### Setup API Keys (Optional but Recommended)

```bash
mkdir -p ~/.config/last30days
cat > ~/.config/last30days/.env << 'EOF'
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
EOF
chmod 600 ~/.config/last30days/.env
```

## Usage

```
/last30days [topic]
/last30days [topic] for [tool]
```

### Examples

- `/last30days prompting techniques for ChatGPT for legal questions`
- `/last30days iOS app mockups for Nano Banana Pro`
- `/last30days What are the best rap songs lately`
- `/last30days remotion animations for Claude Code`
- `/last30days best Claude Code skills`

## What It Does

1. **Researches** - Scans Reddit and X for discussions from the last 30 days
2. **Synthesizes** - Identifies patterns, best practices, and what actually works
3. **Delivers** - Either writes copy-paste-ready prompts for your target tool, or gives you a curated expert-level answer

### Query Types

| Type | Trigger | Output |
|------|---------|--------|
| **Prompting** | "X prompts", "prompting for X" | Techniques + copy-paste prompts |
| **Recommendations** | "best X", "top X" | Ranked list with engagement metrics |
| **News** | "what's happening with X" | Current events and updates |
| **General** | Anything else | Broad community insights |

## How It Works

The skill uses:
- OpenAI's Responses API with web search to find Reddit discussions
- xAI's API with live X search to find posts
- Real Reddit thread enrichment for engagement metrics
- Scoring algorithm that weighs recency, relevance, and engagement

### Operating Modes

| Mode | API Keys | Coverage |
|------|----------|----------|
| **Full** | Both | Reddit + X + Web with engagement metrics |
| **Partial** | One | Reddit-only or X-only + Web |
| **Web-only** | None | Web search fallback (still useful) |

## Options

| Flag | Description |
|------|-------------|
| `--quick` | Faster research, fewer sources (8-12 each) |
| `--deep` | Comprehensive research (50-70 Reddit, 40-60 X) |
| `--debug` | Verbose logging for troubleshooting |
| `--sources=reddit` | Reddit only |
| `--sources=x` | X only |

## Requirements

- Python 3.8+
- **OpenAI API key** - For Reddit research (uses web search)
- **xAI API key** - For X research (optional but recommended)

At least one key is recommended, but skill works without any using WebSearch fallback.

## Example Output

**Query:** `/last30days best Claude Code skills`

**Research finds:**
- 4 Reddit threads (238 upvotes, 156 comments)
- 15 X posts (28K+ likes, 2.8K reposts)

**Top skills discovered:**
1. Remotion skill - 4x mentions, 17.3K likes
2. SkillsMP marketplace - 5x mentions, 60-87K+ skills
3. awesome-claude-skills (GitHub) - 4x mentions
4. Superpowers - 3x mentions, 27.9K stars
5. HeyGen avatar skill - 2x mentions, 736 likes

---

*30 days of research. 30 seconds of work.*

## License

MIT
