# HTML Template Reference — Cinematic Editorial

## Fonts (Fontshare CDN)

```html
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap" />
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700&display=swap" />
```

- **Display**: Clash Grotesk — Bold, uppercase, `letter-spacing:-0.02em`, `line-height:0.85`
- **Body**: General Sans — Weight 300 for copy, 500-600 for labels

## Mermaid.js Integration

```html
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true, theme: 'dark',
  themeVariables: {
    darkMode: true, background: '#1e1916',
    primaryColor: '#DC9F8522', primaryTextColor: '#EBDCC4',
    primaryBorderColor: '#DC9F85', lineColor: '#66473B',
    textColor: '#EBDCC4', mainBkg: '#261f1a',
    nodeBorder: '#35211A', clusterBkg: '#1e1916',
    edgeLabelBackground: '#1e1916', nodeTextColor: '#EBDCC4'
  }
});
</script>
```

Each diagram: `<pre class="mermaid">flowchart TD\n  A-->B</pre>`

## CSS Variables

```css
:root{
  --bg:#181818;--surface:#1e1916;--surface2:#261f1a;--surface3:#2d2520;
  --border:#35211A;--border-accent:#66473B;--text:#EBDCC4;--text2:#B6A596;--text3:#8a7565;
  --coral:#DC9F85;--green:#8B9F6B;--indigo:#8B7EC2;--red:#C26B5A;
  --coral-dim:rgba(220,159,133,.10);--green-dim:rgba(139,159,107,.10);
  --red-dim:rgba(194,107,90,.10);--indigo-dim:rgba(139,126,194,.10);
  --radius:4px;--transition:0.25s cubic-bezier(.4,0,.2,1);
}
```

## Visual Rules

- **No gradients** — Solid colors only
- **No pill shapes** — Max 4px border-radius everywhere
- **1px solid borders** — `#35211A` (subtle) or `#66473B` (accent)
- **Noise overlay** — `body::after` with fractal noise SVG at 0.03 opacity
- **Text depth** — h1 uses `text-shadow: 2px 2px 0 #66473B`
- **Uppercase** — All headers and labels use `text-transform:uppercase`

## Layout: Single-column with sticky nav

```html
<nav> <!-- sticky, rgba(24,24,24,.92), blur backdrop -->
  <div class="inner">
    <a href="#section-id">SECTION NAME</a>
  </div>
</nav>
<div class="container"> <!-- max-width:900px -->
  <div class="pr-header">...</div>
  <div class="stats">...</div>
  <section id="section-id">...</section>
</div>
```

## Components

### Diagram Card
```html
<div class="diagram-card">
  <h3>DIAGRAM TITLE</h3>
  <div class="diagram-desc">What this diagram shows</div>
  <pre class="mermaid">stateDiagram-v2
    [*] --> Idle
  </pre>
</div>
```

### Before/After Cards
```html
<div class="before-after"> <!-- 2-col grid -->
  <div class="ba-card before"><h4>⛔ Before</h4><p>Old pain</p></div>
  <div class="ba-card after"><h4>✅ After</h4><p>New behavior</p></div>
</div>
```

### Callout
```html
<div class="callout green"> <!-- 2px left border, accent color -->
  <strong>Key insight:</strong> Explanation text
</div>
```

### ASCII Box
```html
<div class="ascii-box">
  ┌──────────────────┐
  │  Schema diagram  │
  └──────────────────┘
</div>
```

### File Table
```html
<table class="file-table">
  <thead><tr><th>File</th><th>Status</th><th>Changes</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr>
      <td>file.tsx</td>
      <td><span class="tag tag-new">NEW</span></td>
      <td><span class="add">+268</span></td>
      <td>Short description</td>
    </tr>
  </tbody>
</table>
```

### Review Notes
```html
<div class="review-notes">
  <ul class="check-list">
    <li><span class="check-icon">✓</span> All tests pass</li>
  </ul>
</div>
```
## JS + Responsive

1. **IntersectionObserver** — highlights active nav link on scroll
2. **Scroll-to-top button** — appears after 400px scroll

## Responsive Breakpoints

- Below 700px: container 16px padding
- Below 600px: stats 2-col, before-after single-col, impact-grid single-col
- Fonts: Clash Grotesk (display), General Sans (body), SF Mono/Menlo (mono)

## Color Mapping

| Name | CSS Var | Dim Variant | Use |
|------|---------|-------------|-----|
| coral-rust | `--coral` | `--coral-dim` | Primary accent, file counts |
| olive | `--green` | `--green-dim` | Additions, success, after cards |
| indigo | `--indigo` | `--indigo-dim` | Secondary accent, tests |
| rust-red | `--red` | `--red-dim` | Deletions, before cards |
