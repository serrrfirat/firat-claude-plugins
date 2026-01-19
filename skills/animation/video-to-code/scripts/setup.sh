#!/bin/bash
#
# Setup script for video-to-code dependencies
#
# Usage:
#   ./setup.sh
#
# This installs the required npm packages globally or in /tmp for use with the scripts.

set -e

echo "Video to Code - Setup"
echo "====================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  echo "Install it from: https://nodejs.org/"
  exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Check for GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Warning: GEMINI_API_KEY is not set"
  echo ""
  echo "To use the analyze-video script, you need a Gemini API key."
  echo "Get one at: https://aistudio.google.com/apikey"
  echo ""
  echo "Add to your ~/.zshrc or ~/.bashrc:"
  echo "  export GEMINI_API_KEY=\"your-key-here\""
  echo ""
else
  echo "GEMINI_API_KEY: ✓ Set"
  echo ""
fi

# Install dependencies in /tmp for the scripts
echo "Installing dependencies in /tmp..."
echo ""

cd /tmp

# Install @google/generative-ai
echo "Installing @google/generative-ai..."
npm install @google/generative-ai --silent

# Install puppeteer
echo "Installing puppeteer..."
npm install puppeteer --silent

echo ""
echo "Setup complete!"
echo ""
echo "You can now use the scripts:"
echo "  node scripts/download-video.mjs <url>"
echo "  node scripts/analyze-video.mjs <video-path>"
echo ""
