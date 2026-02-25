#!/usr/bin/env node
/**
 * PR Explainer HTML Generator — Diagram-centric layout
 *
 * Generates a single self-contained HTML file with mermaid.js diagrams,
 * dark theme, sticky nav, diagram cards, before/after cards, ASCII boxes,
 * callouts, file table, and review notes.
 *
 * Usage:
 *   node generate-pr-explainer.js --data pr-data.json --output pr-review.html
 *   node generate-pr-explainer.js --data pr-data.json --title "My PR" --output out.html
 *   echo '{"title":"Test",...}' | node generate-pr-explainer.js --output out.html
 *
 * Input: JSON file or stdin matching the schema below
 * Output: Self-contained HTML file with mermaid.js CDN
 */

const fs = require("fs");
const path = require("path");

// ─── CLI ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { title: null, output: "pr-review.html", data: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--title" && argv[i + 1]) args.title = argv[++i];
    else if (argv[i] === "--output" && argv[i + 1]) args.output = argv[++i];
    else if (argv[i] === "--data" && argv[i + 1]) args.data = argv[++i];
    else if (argv[i] === "--help") {
      console.log(
        "Usage: generate-pr-explainer.js --data <json> [--title <title>] [--output <file>]"
      );
      process.exit(0);
    }
  }
  return args;
}

// ─── Validation ──────────────────────────────────────────────────────

function validateData(data) {
  const errors = [];
  if (!data.title) errors.push("Missing required field: title");
  if (!data.stats) errors.push("Missing required field: stats");
  if (!Array.isArray(data.sections) || data.sections.length === 0)
    errors.push("sections must be a non-empty array");
  if (!Array.isArray(data.files) || data.files.length === 0)
    errors.push("files must be a non-empty array");
  if (data.stats) {
    for (const k of ["files", "insertions", "deletions"]) {
      if (typeof data.stats[k] !== "number")
        errors.push(`stats.${k} must be a number`);
    }
  }
  return errors;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colorVar(color) {
  const map = {
    coral: "--coral",
    green: "--green",
    indigo: "--indigo",
    red: "--red",
  };
  return map[color] || "--coral";
}

// ─── CSS — High-Contrast Mono + Red ──────────────────────────────────

const CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#000;--surface:#09090b;--surface2:#18181b;--surface3:#262626;
  --border:#333;--text:#fafafa;--text2:#e5e5e5;--text3:#888;
  --coral:#ef4444;--green:#4ade80;--indigo:#666;--red:#ef4444;
  --coral-dim:rgba(239,68,68,.08);--green-dim:rgba(74,222,128,.08);
  --red-dim:rgba(239,68,68,.08);--indigo-dim:rgba(102,102,102,.08);
  --radius:3px;--transition:0.5s cubic-bezier(0.16,1,0.3,1);
  --ease:cubic-bezier(0.16,1,0.3,1);
}
html{scroll-behavior:smooth}
body{background:#000 radial-gradient(ellipse at center,rgba(139,69,69,0.4) 0%,rgba(20,20,20,0.8) 60%,rgba(0,0,0,0.95) 100%) fixed;color:var(--text);font-family:'ZTNature','Inter',system-ui,sans-serif;font-weight:300;line-height:1.7;min-height:100vh;-webkit-font-smoothing:antialiased}
body::after{content:'';position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:0.15;mix-blend-mode:overlay;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-repeat:repeat;background-size:300px 300px}

/* Layout */
.container{max-width:900px;margin:0 auto;padding:48px 32px 100px}
@media(max-width:700px){.container{padding:24px 16px 60px}}

/* Nav */
nav{position:sticky;top:0;z-index:50;background:rgba(0,0,0,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:12px 0}
nav .inner{max-width:900px;margin:0 auto;padding:0 32px;display:flex;gap:16px;overflow-x:auto;scrollbar-width:none}
nav .inner::-webkit-scrollbar{display:none}
nav a{color:var(--text3);text-decoration:none;font-family:'JetBrains Mono','SF Mono',Menlo,monospace;font-size:12px;font-weight:400;white-space:nowrap;padding:6px 12px;border-radius:var(--radius);transition:color var(--transition);text-transform:uppercase;letter-spacing:.08em}
nav a:hover{color:var(--text)}
nav a.active{color:var(--coral)}

/* Header */
.pr-header{text-align:center;padding:80px 0 56px}
.pr-header .badge{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono','SF Mono',monospace;font-size:11px;font-weight:400;padding:5px 14px;border-radius:var(--radius);margin-bottom:24px;text-transform:uppercase;letter-spacing:.1em;border:1px solid var(--border)}
.pr-header h1{font-size:clamp(40px,11vw,96px);font-weight:900;line-height:0.9;margin-bottom:20px;letter-spacing:-0.03em;color:var(--text);text-transform:uppercase;transition:transform 0.1s linear}
.pr-header .subtitle{color:var(--text3);font-size:1.25rem;font-weight:300;max-width:600px;margin:0 auto 32px;letter-spacing:-0.01em}
.commits{display:flex;flex-direction:column;gap:6px;align-items:center}
.commit{font-size:13px;color:var(--text3);font-weight:300}
.commit code{font-family:'JetBrains Mono','SF Mono',Menlo,monospace;color:var(--coral);font-size:12px;background:var(--coral-dim);padding:2px 8px;border-radius:var(--radius);margin-right:6px;border:1px solid rgba(239,68,68,.15)}

/* Stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-bottom:56px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{background:var(--surface);padding:28px 24px;text-align:center}
.stat:hover .val{color:var(--coral)}
.stat .val{font-size:42px;font-weight:900;line-height:1;letter-spacing:-0.03em;transition:color var(--transition)}
.stat .lbl{font-family:'JetBrains Mono','SF Mono',monospace;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-top:8px;font-weight:400}
.stat.s1 .val{color:var(--text)}.stat.s2 .val{color:var(--text)}.stat.s3 .val{color:var(--text)}.stat.s4 .val{color:var(--text)}

/* Sections */
section{margin-bottom:72px}
section > h2{font-size:28px;font-weight:500;margin-bottom:8px;display:flex;align-items:center;gap:10px;text-transform:uppercase;letter-spacing:-0.02em}
section > h2 .icon{width:32px;height:32px;border-radius:var(--radius);display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;border:1px solid var(--border)}
section > .section-sub{color:var(--text3);font-size:1rem;margin-bottom:28px;font-weight:300}

/* Diagram containers */
.diagram-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px;margin-bottom:24px}
.diagram-card h3{font-family:'JetBrains Mono','SF Mono',monospace;font-size:13px;font-weight:400;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3)}
.diagram-card .diagram-desc{color:var(--text3);font-size:0.95rem;margin-bottom:24px;line-height:1.7;font-weight:300}
.diagram-card pre.mermaid{display:flex;justify-content:center;margin:0;background:transparent;overflow-x:auto}
.diagram-card pre.mermaid svg{max-width:100%}

/* ASCII diagrams */
.ascii-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin:16px 0;overflow-x:auto;font-family:'JetBrains Mono','SF Mono',Menlo,monospace;font-size:13px;line-height:1.6;color:var(--text3);white-space:pre}
.ascii-box .hl-coral{color:var(--coral)}.ascii-box .hl-green{color:var(--green)}.ascii-box .hl-indigo{color:var(--indigo)}.ascii-box .hl-red{color:var(--red)}

/* Before/After */
.before-after{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:20px 0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
@media(max-width:600px){.before-after{grid-template-columns:1fr}}
.ba-card{background:var(--surface);padding:24px}
.ba-card h4{font-family:'JetBrains Mono','SF Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-weight:400}
.ba-card.before h4{color:var(--text3)}.ba-card.after h4{color:var(--text)}
.ba-card p{font-size:0.95rem;color:var(--text3);line-height:1.6;font-weight:300}
.ba-card code{font-family:'JetBrains Mono','SF Mono',monospace;font-size:12px;background:var(--surface2);padding:2px 6px;border-radius:var(--radius)}

/* Callouts */
.callout{border-left:2px solid var(--coral);background:var(--surface);border-radius:0 var(--radius) var(--radius) 0;padding:20px 24px;margin:20px 0;font-size:0.95rem;color:var(--text3);line-height:1.7;font-weight:300}
.callout strong{color:var(--text);font-weight:500}
.callout.green{border-left-color:var(--green)}
.callout.indigo{border-left-color:var(--text3)}

/* Impact list */
.impact-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:20px 0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
@media(max-width:600px){.impact-grid{grid-template-columns:1fr}}
.impact-item{background:var(--surface);padding:20px 24px}
.impact-item .num{font-size:32px;font-weight:900;color:var(--text);letter-spacing:-0.03em}
.impact-item .desc{font-family:'JetBrains Mono','SF Mono',monospace;font-size:12px;color:var(--text3);margin-top:4px;font-weight:400}

/* Review Notes */
.review-notes{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
.check-list{list-style:none}
.check-list li{display:flex;align-items:center;gap:10px;padding:10px 0;font-size:0.95rem;color:var(--text3);border-bottom:1px solid var(--border);font-weight:300}
.check-list li:last-child{border-bottom:none}
.check-icon{color:var(--green);font-weight:700;font-size:16px}

/* File summary table */
.file-table{width:100%;border-collapse:collapse;font-size:13px;margin:16px 0}
.file-table th{font-family:'JetBrains Mono','SF Mono',monospace;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);padding:10px 12px;border-bottom:1px solid var(--border);font-weight:400}
.file-table td{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text3);font-weight:300}
.file-table td:first-child{font-family:'JetBrains Mono','SF Mono',Menlo,monospace;color:var(--text2)}
.file-table .add{color:var(--green)}.file-table .del{color:var(--red)}
.file-table .tag{font-family:'JetBrains Mono','SF Mono',monospace;font-size:10px;padding:2px 6px;border-radius:var(--radius);font-weight:400;border:1px solid var(--border)}
.file-table .tag-new{background:var(--green-dim);color:var(--green)}
.file-table .tag-mod{background:var(--coral-dim);color:var(--coral)}

/* Scroll to top */
.scroll-top{position:fixed;bottom:24px;right:24px;width:42px;height:42px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--border);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all var(--transition);font-size:18px}
.scroll-top.visible{opacity:1}.scroll-top:hover{background:var(--coral);color:#000;border-color:var(--coral)}

/* Entrance animations */
.anim{opacity:0;transform:translateY(30px);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease)}
.anim.visible{opacity:1;transform:translateY(0)}`;

// ─── Mermaid config (ES module CDN) ──────────────────────────────────

const MERMAID_INIT = `import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  flowchart: { curve: 'basis', padding: 16 },
  sequence: { mirrorActors: false },
  themeVariables: {
    darkMode: true,
    background: '#09090b',
    primaryColor: '#ef444422',
    primaryTextColor: '#fafafa',
    primaryBorderColor: '#ef4444',
    secondaryColor: '#33333333',
    secondaryTextColor: '#e5e5e5',
    secondaryBorderColor: '#444',
    tertiaryColor: '#4ade8022',
    lineColor: '#444',
    textColor: '#e5e5e5',
    mainBkg: '#18181b',
    nodeBorder: '#333',
    clusterBkg: '#09090b',
    clusterBorder: '#333',
    titleColor: '#fafafa',
    edgeLabelBackground: '#09090b',
    nodeTextColor: '#e5e5e5'
  }
});`;

// ─── Client-side JS ──────────────────────────────────────────────────

const CLIENT_JS = `// Nav highlight on scroll
var sections = document.querySelectorAll('section, .pr-header');
var navLinks = document.querySelectorAll('nav a');
var navObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      var id = e.target.id;
      var link = document.querySelector('nav a[href="#' + id + '"]');
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });
sections.forEach(function(s) { navObs.observe(s); });

// Scroll-linked header transform + scroll-to-top
var heroH1 = document.querySelector('.pr-header h1');
window.addEventListener('scroll', function() {
  var t = Math.min(window.scrollY / 600, 1);
  if (heroH1) heroH1.style.transform = 'scale(' + (1 - t * 0.11) + ')';
  document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

// Entrance animations
var animObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('visible'); animObs.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.diagram-card,.ba-card,.callout,.ascii-box,.stat,.review-notes').forEach(function(el) {
  el.classList.add('anim'); animObs.observe(el);
});`;

// ─── Generators ──────────────────────────────────────────────────────

function generateNav(data) {
  let html = '<nav>\n  <div class="inner">\n';
  html += '    <a href="#overview">Overview</a>\n';
  for (const s of data.sections) {
    html += `    <a href="#${s.id}">${escapeHtml(s.title)}</a>\n`;
  }
  html += '    <a href="#files">Files</a>\n';
  if (data.reviewNotes && data.reviewNotes.length) {
    html += '    <a href="#review">Review</a>\n';
  }
  html += '  </div>\n</nav>';
  return html;
}

function generateHeader(data) {
  const statusConfig = {
    merged: {
      label: "✓ Merged",
      bg: "var(--green-dim)",
      color: "var(--green)",
    },
    open: {
      label: "● Open",
      bg: "var(--coral-dim)",
      color: "var(--coral)",
    },
    draft: {
      label: "◐ Draft",
      bg: "var(--surface3)",
      color: "var(--text3)",
    },
  };
  const sc = statusConfig[data.status] || statusConfig.merged;

  let html = '<div class="pr-header" id="overview">\n';
  html += `  <div class="badge" style="background:${sc.bg};color:${sc.color}">${sc.label}</div>\n`;
  html += `  <h1>${escapeHtml(data.title)}</h1>\n`;
  if (data.subtitle) {
    html += `  <p class="subtitle">${data.subtitle}</p>\n`;
  }
  if (data.commits && data.commits.length) {
    html += '  <div class="commits">\n';
    for (const c of data.commits) {
      html += `    <div class="commit"><code>${escapeHtml(c.sha)}</code> ${escapeHtml(c.message)}</div>\n`;
    }
    html += "  </div>\n";
  }
  html += "</div>";
  return html;
}

function generateStats(data) {
  const s = data.stats;
  let html = '<div class="stats">\n';
  html += `  <div class="stat s1"><div class="val">${s.files}</div><div class="lbl">Files Changed</div></div>\n`;
  html += `  <div class="stat s2"><div class="val">+${Number(s.insertions).toLocaleString()}</div><div class="lbl">Insertions</div></div>\n`;
  html += `  <div class="stat s3"><div class="val">-${Number(s.deletions).toLocaleString()}</div><div class="lbl">Deletions</div></div>\n`;
  if (s.tests != null) {
    html += `  <div class="stat s4"><div class="val">${s.tests}</div><div class="lbl">Tests Passing</div></div>\n`;
  }
  html += "</div>";
  return html;
}

function generateSections(data) {
  let html = "";
  for (const section of data.sections) {
    const cv = colorVar(section.color);
    html += `\n<section id="${section.id}">\n`;
    html += `  <h2><span class="icon" style="background:var(${cv}-dim);color:var(${cv})">${section.icon || "📦"}</span> ${escapeHtml(section.title)}</h2>\n`;
    if (section.subtitle) {
      html += `  <p class="section-sub">${section.subtitle}</p>\n`;
    }

    // Diagrams
    if (section.diagrams && section.diagrams.length) {
      for (const d of section.diagrams) {
        html += '\n  <div class="diagram-card">\n';
        html += `    <h3>${escapeHtml(d.title)}</h3>\n`;
        if (d.description) {
          html += `    <div class="diagram-desc">${d.description}</div>\n`;
        }
        html += `    <pre class="mermaid">\n${d.mermaid}\n    </pre>\n`;
        html += "  </div>\n";
      }
    }

    // Before / After
    if (section.beforeAfter) {
      html += '\n  <div class="before-after">\n';
      html += '    <div class="ba-card before">\n';
      html += "      <h4>⛔ Before</h4>\n";
      html += `      <p>${section.beforeAfter.before}</p>\n`;
      html += "    </div>\n";
      html += '    <div class="ba-card after">\n';
      html += "      <h4>✅ After</h4>\n";
      html += `      <p>${section.beforeAfter.after}</p>\n`;
      html += "    </div>\n";
      html += "  </div>\n";
    }

    // Callouts
    if (section.callouts && section.callouts.length) {
      for (const c of section.callouts) {
        const cls = c.color && c.color !== "coral" ? ` ${c.color}` : "";
        html += `\n  <div class="callout${cls}">\n    ${c.text}\n  </div>\n`;
      }
    }

    // ASCII box
    if (section.ascii) {
      html += `\n  <div class="ascii-box">${section.ascii}</div>\n`;
    }

    html += "</section>\n";
  }
  return html;
}

function generateFileTable(data) {
  const commitCount = (data.commits || []).length;
  const commitStr = commitCount
    ? ` across ${commitCount} commit${commitCount === 1 ? "" : "s"}`
    : "";

  let html = '\n<section id="files">\n';
  html += '  <h2><span class="icon" style="background:var(--surface3);color:var(--text2)">📁</span> All Changed Files</h2>\n';
  html += `  <p class="section-sub">${data.stats.files} files${commitStr}. New files marked in green.</p>\n`;
  html += '\n  <table class="file-table">\n';
  html += "    <thead><tr><th>File</th><th>Status</th><th>Changes</th><th>Purpose</th></tr></thead>\n";
  html += "    <tbody>\n";
  for (const f of data.files) {
    const tag =
      f.status === "new"
        ? '<span class="tag tag-new">NEW</span>'
        : '<span class="tag tag-mod">MOD</span>';
    const parts = [];
    if (f.additions != null && f.additions > 0)
      parts.push(`<span class="add">+${f.additions}</span>`);
    if (f.deletions != null && f.deletions > 0)
      parts.push(`<span class="del">-${f.deletions}</span>`);
    const changes = parts.join(" ");
    html += `      <tr><td>${escapeHtml(f.name)}</td><td>${tag}</td><td>${changes}</td><td>${escapeHtml(f.purpose || "")}</td></tr>\n`;
  }
  html += "    </tbody>\n";
  html += "  </table>\n";
  html += "</section>\n";
  return html;
}

function generateReviewNotes(data) {
  if (!data.reviewNotes || !data.reviewNotes.length) return "";
  let html = '\n<section id="review">\n';
  html += '  <h2><span class="icon" style="background:var(--green-dim);color:var(--green)">✓</span> Review Notes</h2>\n';
  html += '  <p class="section-sub">Quality gates all green.</p>\n';
  html += '\n  <div class="review-notes">\n';
  html += '    <ul class="check-list">\n';
  for (const note of data.reviewNotes) {
    html += `      <li><span class="check-icon">✓</span> ${note}</li>\n`;
  }
  html += "    </ul>\n";
  html += "  </div>\n";
  html += "</section>\n";
  return html;
}

// ─── Main HTML assembly ─────────────────────────────────────────────

function generateHtml(data) {
  const title = escapeHtml(data.title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&family=JetBrains+Mono:wght@400&display=swap">
<title>PR Review \u2014 ${title}</title>
<style>
${CSS}
</style>
</head>
<body>

${generateNav(data)}

<div class="container">

${generateHeader(data)}

${generateStats(data)}
${generateSections(data)}
${generateFileTable(data)}
${generateReviewNotes(data)}
</div>

<button class="scroll-top" id="scrollTop" onclick="window.scrollTo({top:0})">↑</button>

<script type="module">
${MERMAID_INIT}
</script>
<script>
${CLIENT_JS}
</script>
</body>
</html>`;
}

// ─── Stdin reader ────────────────────────────────────────────────────

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
    setTimeout(() => {
      if (!data) reject(new Error("No stdin data received within 5s"));
    }, 5000);
  });
}

// ─── Entry point ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  let raw;

  if (args.data) {
    const p = path.resolve(args.data);
    if (!fs.existsSync(p)) {
      console.error(`Error: File not found: ${p}`);
      process.exit(1);
    }
    raw = fs.readFileSync(p, "utf8");
  } else if (!process.stdin.isTTY) {
    raw = await readStdin();
  } else {
    console.error("Error: Provide --data <file> or pipe JSON via stdin");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Error: Invalid JSON — ${e.message}`);
    process.exit(1);
  }

  if (args.title) data.title = args.title;

  const errors = validateData(data);
  if (errors.length) {
    console.error("Validation errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const html = generateHtml(data);
  const outPath = path.resolve(args.output);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`✅ Generated: ${outPath} (${Math.round(html.length / 1024)}KB)`);
}

// ─── Exports (for testing) ───────────────────────────────────────────

module.exports = {
  parseArgs,
  validateData,
  escapeHtml,
  generateHtml,
  generateNav,
  generateHeader,
  generateStats,
  generateSections,
  generateFileTable,
  generateReviewNotes,
};

// Run if called directly
if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
