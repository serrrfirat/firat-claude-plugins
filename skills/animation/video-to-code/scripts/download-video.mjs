#!/usr/bin/env node
/**
 * Download video from authenticated URLs using Puppeteer
 *
 * Usage:
 *   node download-video.mjs <page-url> [output-path]
 *
 * Examples:
 *   node download-video.mjs "https://example.com/page-with-video"
 *   node download-video.mjs "https://example.com/page" "/tmp/my-video.mp4"
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const pageUrl = process.argv[2];
const outputPath = process.argv[3] || '/tmp/animation.mp4';

if (!pageUrl) {
  console.error('Usage: node download-video.mjs <page-url> [output-path]');
  console.error('');
  console.error('Examples:');
  console.error('  node download-video.mjs "https://example.com/page-with-video"');
  console.error('  node download-video.mjs "https://example.com/page" "/tmp/my-video.mp4"');
  process.exit(1);
}

async function downloadVideo() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let videoUrl = null;
  const videoUrls = [];

  // Intercept network requests to find video URLs with auth tokens
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';

    if (
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.mov') ||
      url.includes('video') ||
      contentType.includes('video/')
    ) {
      console.log('Found video URL:', url.substring(0, 100) + (url.length > 100 ? '...' : ''));
      videoUrls.push(url);
      videoUrl = url;
    }
  });

  console.log(`Navigating to: ${pageUrl}`);
  try {
    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
  } catch (err) {
    console.warn('Navigation warning:', err.message);
  }

  // Wait a bit for any lazy-loaded videos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Also try to get the video src directly from the DOM
  const domVideoSrc = await page.evaluate(() => {
    const video = document.querySelector('video');
    if (!video) return null;

    // Try various ways to get the video source
    return video.src ||
           video.currentSrc ||
           video.querySelector('source')?.src ||
           video.getAttribute('data-src');
  });

  if (domVideoSrc) {
    console.log('Found video in DOM:', domVideoSrc.substring(0, 100) + (domVideoSrc.length > 100 ? '...' : ''));
    videoUrls.push(domVideoSrc);
  }

  // Use the last found URL (usually the actual video, not poster)
  const finalUrl = videoUrl || domVideoSrc;

  if (!finalUrl) {
    console.error('Could not find any video URL on the page');
    console.log('');
    console.log('Tip: Make sure the page contains a <video> element or streams video content.');
    await browser.close();
    process.exit(1);
  }

  console.log('');
  console.log('Downloading video...');

  try {
    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Check if it's actually a video (not an error page)
    if (buffer.byteLength < 1000) {
      const text = new TextDecoder().decode(buffer);
      if (text.includes('<?xml') || text.includes('AccessDenied') || text.includes('Authorization')) {
        console.error('Download failed - received auth error instead of video');
        console.error('Response:', text.substring(0, 200));
        await browser.close();
        process.exit(1);
      }
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, Buffer.from(buffer));

    console.log(`Saved to: ${outputPath}`);
    console.log(`File size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error('Download failed:', err.message);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('Done!');
}

downloadVideo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
