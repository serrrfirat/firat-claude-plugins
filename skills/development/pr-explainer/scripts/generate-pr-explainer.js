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

// ─── CSS (matches reference pr-review.html exactly) ──────────────────

const CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0a;--surface:#111113;--surface2:#1a1a1e;--surface3:#222228;
  --border:#2a2a30;--text:#e4e4e7;--text2:#a1a1aa;--text3:#71717a;
  --coral:#FF6B50;--green:#22c55e;--indigo:#4F46E5;--red:#ef4444;
  --coral-dim:rgba(255,107,80,.12);--green-dim:rgba(34,197,94,.12);
  --red-dim:rgba(239,68,68,.12);--indigo-dim:rgba(79,70,229,.12);
  --radius:12px;--transition:0.25s cubic-bezier(.4,0,.2,1);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.7;min-height:100vh}

/* Layout */
.container{max-width:900px;margin:0 auto;padding:48px 32px 100px}
@media(max-width:700px){.container{padding:24px 16px 60px}}

/* Nav */
nav{position:sticky;top:0;z-index:50;background:rgba(10,10,10,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 0}
nav .inner{max-width:900px;margin:0 auto;padding:0 32px;display:flex;gap:12px;overflow-x:auto;scrollbar-width:none}
nav .inner::-webkit-scrollbar{display:none}
nav a{color:var(--text3);text-decoration:none;font-size:13px;font-weight:500;white-space:nowrap;padding:6px 14px;border-radius:8px;transition:all var(--transition)}
nav a:hover{color:var(--text);background:var(--surface2)}
nav a.active{color:var(--coral);background:var(--coral-dim)}

/* Header */
.pr-header{text-align:center;padding:60px 0 48px}
.pr-header .badge{display:inline-flex;align-items:center;gap:6px;background:var(--green-dim);color:var(--green);font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.05em}
.pr-header h1{font-size:36px;font-weight:800;line-height:1.2;margin-bottom:12px;background:linear-gradient(135deg,var(--text) 30%,var(--coral));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pr-header .subtitle{color:var(--text2);font-size:16px;max-width:600px;margin:0 auto 24px}
.commits{display:flex;flex-direction:column;gap:6px;align-items:center}
.commit{font-size:13px;color:var(--text3)}
.commit code{font-family:"SF Mono",Menlo,Consolas,monospace;color:var(--coral);font-size:12px;background:var(--coral-dim);padding:2px 8px;border-radius:4px;margin-right:6px}

/* Stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:56px}
@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;text-align:center;transition:all var(--transition)}
.stat:hover{border-color:var(--coral);transform:translateY(-2px)}
.stat .val{font-size:36px;font-weight:800;line-height:1}
.stat .lbl{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:6px}
.stat.s1 .val{color:var(--coral)}.stat.s2 .val{color:var(--green)}.stat.s3 .val{color:var(--red)}.stat.s4 .val{color:var(--indigo)}

/* Sections */
section{margin-bottom:64px}
section > h2{font-size:24px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:10px}
section > h2 .icon{width:32px;height:32px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
section > .section-sub{color:var(--text2);font-size:14px;margin-bottom:28px}

/* Diagram containers */
.diagram-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;margin-bottom:24px}
.diagram-card h3{font-size:17px;font-weight:600;margin-bottom:6px}
.diagram-card .diagram-desc{color:var(--text2);font-size:14px;margin-bottom:20px;line-height:1.7}
.diagram-card pre.mermaid{display:flex;justify-content:center;margin:0;background:transparent;overflow-x:auto}
.diagram-card pre.mermaid svg{max-width:100%}

/* ASCII diagrams */
.ascii-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:20px 24px;margin:16px 0;overflow-x:auto;font-family:"SF Mono",Menlo,Consolas,monospace;font-size:13px;line-height:1.5;color:var(--text2);white-space:pre}
.ascii-box .hl-coral{color:var(--coral)}.ascii-box .hl-green{color:var(--green)}.ascii-box .hl-indigo{color:var(--indigo)}.ascii-box .hl-red{color:var(--red)}

/* Before/After */
.before-after{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
@media(max-width:600px){.before-after{grid-template-columns:1fr}}
.ba-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px}
.ba-card h4{font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.ba-card.before h4{color:var(--red)}.ba-card.after h4{color:var(--green)}
.ba-card p{font-size:13px;color:var(--text2);line-height:1.6}
.ba-card code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12px;background:var(--surface3);padding:2px 6px;border-radius:3px}

/* Callouts */
.callout{border-left:3px solid var(--coral);background:var(--surface);border-radius:0 var(--radius) var(--radius) 0;padding:16px 20px;margin:20px 0;font-size:14px;color:var(--text2);line-height:1.7}
.callout strong{color:var(--text)}
.callout.green{border-left-color:var(--green)}
.callout.indigo{border-left-color:var(--indigo)}

/* Impact list */
.impact-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
@media(max-width:600px){.impact-grid{grid-template-columns:1fr}}
.impact-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px}
.impact-item .num{font-size:24px;font-weight:800;color:var(--coral)}
.impact-item .desc{font-size:13px;color:var(--text2);margin-top:4px}

/* Review Notes */
.review-notes{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
.check-list{list-style:none}
.check-list li{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:14px;color:var(--text2);border-bottom:1px solid var(--border)}
.check-list li:last-child{border-bottom:none}
.check-icon{color:var(--green);font-weight:700;font-size:16px}

/* File summary table */
.file-table{width:100%;border-collapse:collapse;font-size:13px;margin:16px 0}
.file-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);padding:8px 12px;border-bottom:1px solid var(--border)}
.file-table td{padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text2)}
.file-table td:first-child{font-family:"SF Mono",Menlo,Consolas,monospace;color:var(--text)}
.file-table .add{color:var(--green)}.file-table .del{color:var(--red)}
.file-table .tag{font-size:10px;padding:2px 6px;border-radius:3px;font-weight:600}
.file-table .tag-new{background:var(--green-dim);color:var(--green)}
.file-table .tag-mod{background:var(--coral-dim);color:var(--coral)}

/* Scroll to top */
.scroll-top{position:fixed;bottom:24px;right:24px;width:42px;height:42px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all var(--transition);font-size:18px}
.scroll-top.visible{opacity:1}.scroll-top:hover{background:var(--coral);color:#fff;border-color:var(--coral)}`;

// ─── Mermaid config (ES module CDN) ──────────────────────────────────

const MERMAID_INIT = `import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  flowchart: { curve: 'basis', padding: 16 },
  sequence: { mirrorActors: false },
  themeVariables: {
    darkMode: true,
    background: '#111113',
    primaryColor: '#FF6B5033',
    primaryTextColor: '#e4e4e7',
    primaryBorderColor: '#FF6B50',
    secondaryColor: '#4F46E533',
    secondaryTextColor: '#e4e4e7',
    secondaryBorderColor: '#4F46E5',
    tertiaryColor: '#22c55e33',
    lineColor: '#71717a',
    textColor: '#e4e4e7',
    mainBkg: '#1a1a1e',
    nodeBorder: '#2a2a30',
    clusterBkg: '#111113',
    clusterBorder: '#2a2a30',
    titleColor: '#e4e4e7',
    edgeLabelBackground: '#111113',
    nodeTextColor: '#e4e4e7'
  }
});`;

// ─── Client-side JS ──────────────────────────────────────────────────

const CLIENT_JS = `// Nav highlight on scroll
var sections = document.querySelectorAll('section, .pr-header');
var navLinks = document.querySelectorAll('nav a');
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      var id = e.target.id;
      var link = document.querySelector('nav a[href=\"#' + id + '\"]');
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });
sections.forEach(function(s) { obs.observe(s); });

// Scroll to top button
window.addEventListener('scroll', function() {
  document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 400);
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
<title>PR Review — ${title}</title>
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
