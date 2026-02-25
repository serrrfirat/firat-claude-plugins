# HTML Template Reference — Diagram-Centric Layout

## Mermaid.js Integration

```html
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true, theme: 'dark',
  flowchart: { curve: 'basis', padding: 16 },
  themeVariables: {
    darkMode: true, background: '#111113',
    primaryColor: '#FF6B5033', primaryTextColor: '#e4e4e7',
    primaryBorderColor: '#FF6B50', secondaryColor: '#4F46E533',
    lineColor: '#71717a', textColor: '#e4e4e7',
    mainBkg: '#1a1a1e', nodeBorder: '#2a2a30',
    clusterBkg: '#111113', clusterBorder: '#2a2a30',
    edgeLabelBackground: '#111113', nodeTextColor: '#e4e4e7'
  }
});
</script>
```

Each diagram: `<pre class="mermaid">flowchart TD\n  A-->B</pre>`

## CSS Variables

```css
:root{
  --bg:#0a0a0a;--surface:#111113;--surface2:#1a1a1e;--surface3:#222228;
  --border:#2a2a30;--text:#e4e4e7;--text2:#a1a1aa;--text3:#71717a;
  --coral:#FF6B50;--green:#22c55e;--indigo:#4F46E5;--red:#ef4444;
  --coral-dim:rgba(255,107,80,.12);--green-dim:rgba(34,197,94,.12);
  --red-dim:rgba(239,68,68,.12);--indigo-dim:rgba(79,70,229,.12);
  --radius:12px;--transition:0.25s cubic-bezier(.4,0,.2,1);
}
```

## Layout: Single-column with sticky nav

```html
<nav> <!-- sticky top, blur backdrop -->
  <div class="inner">
    <a href="#section-id">Section Name</a>
  </div>
</nav>
<div class="container"> <!-- max-width:900px, centered -->
  <div class="pr-header">...</div>
  <div class="stats">...</div>
  <section id="section-id">...</section>
</div>
```

## Components

### Diagram Card
```html
<div class="diagram-card">
  <h3>Diagram Title</h3>
  <div class="diagram-desc">What this diagram shows</div>
  <pre class="mermaid">
    stateDiagram-v2
      [*] --> Idle
      Idle --> Running : start
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
<div class="callout green"> <!-- or coral, indigo (border-left color) -->
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

### Impact Grid
```html
<div class="impact-grid"> <!-- 2-col -->
  <div class="impact-item">
    <div class="num">5</div><div class="desc">Features shipped</div>
  </div>
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

## JavaScript (2 features)

1. **IntersectionObserver** — highlights active nav link on scroll
2. **Scroll-to-top button** — appears after 400px scroll

## Responsive Breakpoints

- Below 900px: nav scrollable, container narrower padding
- Below 700px: container 16px padding
- Below 600px: stats 2-col, before-after single-col, impact-grid single-col
- Fonts: system stack + "SF Mono"/Menlo/Consolas for mono

## Color Mapping

| Name | CSS Var | Dim Variant | Use |
|------|---------|-------------|-----|
| coral | `--coral` | `--coral-dim` | Primary, file counts, errors |
| green | `--green` | `--green-dim` | Success, additions, after cards |
| indigo | `--indigo` | `--indigo-dim` | Secondary, tests |
| red | `--red` | `--red-dim` | Deletions, before cards |
