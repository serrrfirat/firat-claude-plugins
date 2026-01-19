---
name: video-to-code
description: Convert video animations and GIF interactions into working React code. Use when the user shares a video URL, GIF, or webpage containing an animation they want to replicate. Triggers include "video to code", "replicate this animation", "build this interaction", "code this GIF", "implement this motion", "recreate this effect".
---

# Video to Code

Convert video animations, GIFs, and interactive demos into production-ready React components by analyzing visual motion frame-by-frame and iterating based on user feedback.

## Workflow Overview

1. **Receive** - User provides a video URL, GIF, or webpage with animation
2. **Download** - Try direct fetch, fallback to Puppeteer for authenticated URLs
3. **Analyze** - Send to Gemini 2.5 Flash for frame-by-frame visual analysis
4. **Generate** - Create implementation in Animation Lab
5. **Preview** - User reviews at `/__animation_lab` route
6. **Feedback** - Collect feedback with AskUserQuestion, iterate until perfect
7. **Finalize** - Export component, clean up temp files

---

## Phase 0: Preflight Detection

Before starting, automatically detect:

### Environment Check
```bash
echo $GEMINI_API_KEY
```

**If missing:** Stop and direct user to Setup section.

### Framework Detection
Check for config files:
- `next.config.js` or `next.config.mjs` or `next.config.ts` → **Next.js**
  - Check for `app/` directory → App Router
  - Check for `pages/` directory → Pages Router
- `vite.config.js` or `vite.config.ts` → **Vite**
- Other frameworks: adapt route creation accordingly

### Package Manager Detection
- `pnpm-lock.yaml` → use `pnpm`
- `yarn.lock` → use `yarn`
- `package-lock.json` → use `npm`
- `bun.lockb` → use `bun`

### Check for Animation Libraries
- `framer-motion` in dependencies → preferred for spring physics
- `react-spring`, `gsap`, etc.

---

## Phase 1: Get Video Source

Ask the user for:
- A direct video/GIF URL (mp4, webm, gif)
- A webpage URL containing the video/animation
- A local file path to a video

---

## Phase 2: Download Video

### Step 2.1: Try Direct Download First

```bash
curl -L -o /tmp/animation.mp4 "VIDEO_URL" && ls -lh /tmp/animation.mp4
```

If the file is very small (< 1KB), it's likely an auth error. Check contents:
```bash
cat /tmp/animation.mp4
```

If you see XML/JSON error or "Authorization" message → use Puppeteer.

### Step 2.2: Use Puppeteer for Authenticated URLs

When direct download fails (Cloudflare R2, signed URLs, etc.), use Puppeteer:

```javascript
// Save as /tmp/download-video.mjs
import puppeteer from 'puppeteer';
import fs from 'fs';

async function downloadVideo() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let videoUrl = null;

  // Intercept network requests to find the video URL with auth tokens
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.mp4') || url.includes('video')) {
      console.log('Found video URL:', url.substring(0, 100) + '...');
      videoUrl = url;
    }
  });

  console.log('Navigating to page...');
  await page.goto('PAGE_URL_HERE', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Also try to get the video src directly from the DOM
  const videoSrc = await page.evaluate(() => {
    const video = document.querySelector('video');
    return video ? video.src || video.querySelector('source')?.src : null;
  });

  const finalUrl = videoUrl || videoSrc;

  if (finalUrl) {
    console.log('Downloading video...');
    const response = await fetch(finalUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync('/tmp/animation.mp4', Buffer.from(buffer));
    console.log('Saved to /tmp/animation.mp4');
    console.log('File size:', buffer.byteLength, 'bytes');
  } else {
    console.log('Could not find video URL');
  }

  await browser.close();
}

downloadVideo().catch(console.error);
```

Run it:
```bash
cd /tmp && npm install puppeteer && node /tmp/download-video.mjs
```

---

## Phase 3: Analyze with Gemini

Create and run analysis script:

```javascript
// Save as /tmp/analyze-video.mjs
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ANALYSIS_PROMPT = `Watch this video carefully, frame by frame. Your job is to write a detailed implementation spec that another AI (Claude) will use to code this exact interaction.

Output the following:

1. **Visual inventory**: List every visual element on screen (shapes, illustrations, icons, text). Describe their appearance, colors, size ratios, and positions.

2. **Interaction mechanics**: Describe exactly how elements respond to the mouse cursor. Which elements move? How much? In which direction relative to cursor movement? Are some elements inverted (moving opposite to cursor)?

3. **Parallax layers**: Identify the depth layers. Which elements move most (foreground)? Which move least (background)? Estimate the movement ratio for each layer.

4. **Motion characteristics**: Describe the easing/physics. Is it linear? Springy? Smooth with inertia? How quickly do elements respond? Is there any delay or overshoot?

5. **Boundaries**: Does the movement have limits? Do elements stop at certain positions or follow the cursor infinitely?

6. **Idle state**: What happens when the mouse isn't moving or leaves the area?

Format this as a direct implementation prompt starting with: "Build a React component that..."

Be extremely specific. Include pixel estimates, percentages, timing in milliseconds, and easing function suggestions where possible.`;

async function analyzeVideo() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const videoData = fs.readFileSync("/tmp/animation.mp4");
  const base64Video = videoData.toString("base64");

  console.log("Video size:", videoData.length, "bytes");
  console.log("Sending to Gemini...\n");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "video/mp4",
        data: base64Video,
      },
    },
    { text: ANALYSIS_PROMPT },
  ]);

  console.log(result.response.text());
}

analyzeVideo().catch(console.error);
```

Run it:
```bash
cd /tmp && npm install @google/generative-ai && node /tmp/analyze-video.mjs
```

**IMPORTANT:** Gemini requires `inlineData` with base64 - it cannot fetch external URLs directly.

---

## Phase 4: Generate Animation Lab

### Directory Structure

Create all files under `.claude-animation/`:

```
.claude-animation/
├── lab/
│   └── Animation.tsx            # Current implementation
├── gemini-spec.md               # Raw Gemini analysis
└── iteration-log.md             # Track changes across iterations
```

### Save the Gemini Spec

Save the Gemini output to `.claude-animation/gemini-spec.md` for reference.

### Create Animation Component

Implement the animation in `.claude-animation/lab/Animation.tsx` based on the Gemini spec.

**For spring/parallax animations, use framer-motion:**
```tsx
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Spring config - adjust these during iteration
const springConfig = { stiffness: 100, damping: 15, mass: 0.8 };
```

### Create Animation Lab Page

Create a page file in the app that imports from `.claude-animation/lab/Animation.tsx`:

**For Vite (create `src/pages/AnimationLabPage.tsx`):**
```tsx
import { useState } from 'react';
import { Animation } from '../../../.claude-animation/lab/Animation';

export function AnimationLabPage() {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: 'white' }}>
      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderBottom: '1px solid #27272a',
        padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            <span style={{ color: '#10b981' }}>Animation Lab</span>
            <span style={{ color: '#71717a', margin: '0 8px' }}>•</span>
            <span style={{ color: '#a1a1aa' }}>Iteration 1</span>
          </h1>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
            [Animation description here]
          </p>
        </div>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          style={{
            padding: '6px 12px', fontSize: 14,
            backgroundColor: '#27272a', color: '#a1a1aa',
            borderRadius: 6, border: 'none', cursor: 'pointer'
          }}
        >
          {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ paddingTop: 80 }}>
        <div style={{ height: fullscreen ? '100vh' : 600 }}>
          <Animation />
        </div>
      </div>

      {/* Info Panel */}
      {!fullscreen && (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            padding: 16, backgroundColor: '#18181b',
            borderRadius: 8, border: '1px solid #27272a'
          }}>
            <h3 style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 12 }}>
              Implementation Details
            </h3>
            <ul style={{ fontSize: 14, color: '#d4d4d8' }}>
              <li>Library: framer-motion</li>
              <li>Spring: stiffness X, damping Y</li>
              {/* Add relevant details */}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Add Route

**Vite with React Router (update `App.tsx`):**
```tsx
import { AnimationLabPage } from './pages/AnimationLabPage'

// Add route:
<Route path="/__animation_lab" element={<AnimationLabPage />} />
```

### Initialize Iteration Log

Create `.claude-animation/iteration-log.md`:
```markdown
# Animation Iteration Log

## Source
- URL: [original URL]
- Type: [animation type]

---

## Iteration 1

**Date:** [date]

**Implementation:**
- Library: framer-motion
- Spring config: { stiffness: X, damping: Y, mass: Z }
- [other details]

**Feedback:** (awaiting)

---
```

---

## Phase 5: Present Animation Lab

After generating files, tell the user:

```
✅ Animation Lab created! (Iteration 1)

Preview at: http://localhost:[PORT]/__animation_lab

Move your mouse around to test the interaction.
Compare it to the original and let me know what needs adjusting.
```

**IMPORTANT:** Do NOT run the dev server yourself - it blocks forever. User should have it running or start it themselves.

---

## Phase 6: Collect Feedback & Iterate

### Step 1: Check Match Quality

Use AskUserQuestion:
```
Question: "How well does the animation match the original?"
Header: "Match"
Options:
- "Perfect!" - Ready to finalize and export
- "Close, minor tweaks" - Small adjustments needed
- "Getting there" - Several things to fix
- "Way off" - Major rework needed
```

### Step 2: If Not Perfect, Get Details

Use AskUserQuestion:
```
Question: "What specifically needs adjustment?"
Header: "Adjustments"
Options (multiSelect: true):
- "Timing" - Animation speed/duration
- "Easing" - Spring feels too stiff or bouncy
- "Movement amount" - Rotates/moves too much or too little
- "Visual appearance" - Dots, colors, sizing
```

Then ask for specific details in chat.

### Common Adjustments Reference

| Issue | What to change |
|-------|----------------|
| "Too stiff" | Lower `stiffness`, increase `damping` |
| "Too bouncy" | Increase `damping`, lower `mass` |
| "Too slow" | Increase `stiffness` |
| "Too fast" | Lower `stiffness`, increase `mass` |
| "Not enough movement" | Increase `maxRotation` or movement multiplier |
| "Too much movement" | Decrease `maxRotation` or movement multiplier |
| "Dots too small" | Increase dot width/height (e.g., 2.5 → 4) |
| "Elements too small" | Increase element size (e.g., 70px → 100px) |
| "Not alive enough" | Add opacity variation, increase dot density |

### Step 3: Apply Changes

1. Update `.claude-animation/lab/Animation.tsx`
2. Log changes in `.claude-animation/iteration-log.md`:
```markdown
## Iteration 2

**Date:** [date]

**Changes:**
- Increased dot size from 2.5px to 4px
- Increased cube size from 70px to 100px
- Adjusted spring: stiffness 100 → 80

**Feedback:** (awaiting)
```

3. Tell user to check the preview again
4. Repeat feedback loop

---

## Phase 7: Finalize

When user says "Perfect!" or approves:

### 7.1: Ask Export Location

Use AskUserQuestion:
```
Question: "Where should I save the final component?"
Header: "Export"
Options:
- "packages/ui/src/components/" - Shared UI package
- "src/components/" - App components folder
- "Keep in .claude-animation/" - Don't move, I'll handle it
```

### 7.2: Export Component

Copy `.claude-animation/lab/Animation.tsx` to chosen location:
- Rename to PascalCase (e.g., `InteractiveBackground.tsx`)
- Clean up imports
- Add TypeScript props interface
- Add to package index if needed

### 7.3: Cleanup

Delete all temporary files:
```bash
rm -rf .claude-animation/
```

Remove route from `App.tsx` and delete `AnimationLabPage.tsx`.

### 7.4: Summary

```
✅ Animation component finalized!

Component saved to: [path]

Implementation:
- Library: framer-motion
- Animation type: [type]
- Iterations: [count]

Usage:
import { ComponentName } from '[path]'

<ComponentName />

All temporary files cleaned up.
```

---

## Abort Handling

If user says "cancel", "abort", "stop", "nevermind", or indicates they don't need it:

1. Confirm: "Got it - cleaning up temporary files."
2. Delete `.claude-animation/` directory
3. Remove route and AnimationLabPage
4. Acknowledge: "Animation lab cleaned up."

---

## Animation Library Reference

| Animation Type | Recommended Libraries |
|----------------|----------------------|
| Parallax/mouse tracking | `framer-motion` with `useSpring` |
| Spring physics | `framer-motion`, `react-spring` |
| Complex timelines | `gsap` (GreenSock) |
| Lottie animations | `lottie-react` |
| 3D/WebGL | `@react-three/fiber` |
| Gestures | `@use-gesture/react` + `framer-motion` |

---

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API key"
3. Copy the key

### 2. Configure the API Key

Add to `~/.zshrc` or `~/.bashrc`:
```bash
export GEMINI_API_KEY="your-api-key-here"
```
Then `source ~/.zshrc` and restart Claude Code.

### 3. Dependencies

The skill installs these in `/tmp` as needed:
- `@google/generative-ai` - Gemini API
- `puppeteer` - Video download from authenticated URLs

Project should have `framer-motion` for most animations.

---

## Tips

- Videos should be 5-30 seconds showing the interaction clearly
- Gemini needs `inlineData` (base64) - it won't fetch URLs
- Use Puppeteer when direct download fails (auth errors)
- Start with Gemini's suggested values, then iterate based on feel
- Common iterations: 2-4 rounds to match the original
