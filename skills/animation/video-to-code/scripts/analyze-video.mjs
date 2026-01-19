#!/usr/bin/env node
/**
 * Analyze video animation using Google Gemini 2.5 Flash
 *
 * Usage:
 *   node analyze-video.mjs <video-path> [output-path]
 *
 * Examples:
 *   node analyze-video.mjs /tmp/animation.mp4
 *   node analyze-video.mjs /tmp/animation.mp4 /tmp/spec.md
 *
 * Requires:
 *   - GEMINI_API_KEY environment variable
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const videoPath = process.argv[2];
const outputPath = process.argv[3];

if (!videoPath) {
  console.error('Usage: node analyze-video.mjs <video-path> [output-path]');
  console.error('');
  console.error('Examples:');
  console.error('  node analyze-video.mjs /tmp/animation.mp4');
  console.error('  node analyze-video.mjs /tmp/animation.mp4 /tmp/spec.md');
  console.error('');
  console.error('Requires GEMINI_API_KEY environment variable');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  console.error('');
  console.error('Get your API key at: https://aistudio.google.com/apikey');
  console.error('Then add to ~/.zshrc or ~/.bashrc:');
  console.error('  export GEMINI_API_KEY="your-key-here"');
  process.exit(1);
}

if (!fs.existsSync(videoPath)) {
  console.error(`Error: Video file not found: ${videoPath}`);
  process.exit(1);
}

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
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const videoData = fs.readFileSync(videoPath);
  const base64Video = videoData.toString("base64");

  // Detect mime type from extension
  const ext = path.extname(videoPath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.gif': 'image/gif'
  };
  const mimeType = mimeTypes[ext] || 'video/mp4';

  console.log(`Video: ${videoPath}`);
  console.log(`Size: ${(videoData.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Type: ${mimeType}`);
  console.log('');
  console.log('Sending to Gemini 2.5 Flash for analysis...');
  console.log('');

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Video,
        },
      },
      { text: ANALYSIS_PROMPT },
    ]);

    const analysis = result.response.text();

    if (outputPath) {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, analysis);
      console.log(`Analysis saved to: ${outputPath}`);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('GEMINI ANALYSIS');
    console.log('='.repeat(60));
    console.log('');
    console.log(analysis);

  } catch (err) {
    console.error('Gemini API error:', err.message);

    if (err.message.includes('API key')) {
      console.error('');
      console.error('Check that your GEMINI_API_KEY is valid.');
    }

    process.exit(1);
  }
}

analyzeVideo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
