# HTML Template Reference — High-Contrast Mono + Red

## Typography

- **Display**: ZTNature (or Inter fallback), weight 900, `letter-spacing:-0.03em`, `line-height:0.9`
- **Body**: ZTNature/Inter, weight 300-400, tight tracking
- **Labels**: JetBrains Mono, 11-13px, uppercase, `letter-spacing:.1em`
- CDN: `fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&family=JetBrains+Mono:wght@400`

## Mermaid.js Integration

```html
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true, theme: 'dark',
  themeVariables: {
    darkMode: true, background: '#09090b',
    primaryColor: '#ef444422', primaryTextColor: '#fafafa',
    primaryBorderColor: '#ef4444', lineColor: '#444',
    textColor: '#e5e5e5', mainBkg: '#18181b',
    nodeBorder: '#333', clusterBkg: '#09090b',
    edgeLabelBackground: '#09090b', nodeTextColor: '#e5e5e5'
  }
});
</script>
```

Each diagram: `<pre class="mermaid">flowchart TD\n  A-->B</pre>`

## CSS Variables

```css
:root{
  --bg:#000;--surface:#09090b;--surface2:#18181b;--surface3:#262626;
  --border:#333;--text:#fafafa;--text2:#e5e5e5;--text3:#888;
  --coral:#ef4444;--green:#4ade80;--indigo:#666;--red:#ef4444;
  --coral-dim:rgba(239,68,68,.08);--green-dim:rgba(74,222,128,.08);
  --red-dim:rgba(239,68,68,.08);--indigo-dim:rgba(102,102,102,.08);
  --radius:3px;--ease:cubic-bezier(0.16,1,0.3,1);
}
```

## Visual Rules

- **Monochromatic** — Black/white only; red (#ef4444) is the singular pop color
- **Radial gradient** — `radial-gradient(ellipse at center,rgba(139,69,69,0.4)...,#000 95%)` on body
- **Noise** — 15% opacity, `mix-blend-mode:overlay`
- **3px radius** max — No pills, no rounded corners
- **1px solid #333** — Uniform border treatment
- **Stats grid** — 1px gap grid, no individual card borders
- **Motion** — `cubic-bezier(0.16,1,0.3,1)`, scroll-linked h1 scale (1→0.89)
- **Entrances** — `.anim` class, fade-up on IntersectionObserver

## Layout

```html
<nav> <!-- sticky, rgba(0,0,0,.88), blur(16px) -->
  <div class="inner">
    <a href="#id">SECTION NAME</a> <!-- JetBrains Mono, 12px -->
  </div>
</nav>
<div class="container"> <!-- max-width:900px -->
  <div class="pr-header">
    <h1>TITLE</h1> <!-- 11vw, weight 900, -0.03em tracking -->
  </div>
</div>
```

## Components

### Diagram Card
```html
<div class="diagram-card"> <!-- .anim entrance -->
  <h3>DIAGRAM TITLE</h3> <!-- JetBrains Mono, 13px, mono label -->
  <div class="diagram-desc">Description in body weight</div>
  <pre class="mermaid">stateDiagram-v2
    [*] --> Idle
  </pre>
</div>
```

### Before/After Cards
```html
<div class="before-after"> <!-- 1px gap grid, shared border -->
  <div class="ba-card before"><h4>⛔ BEFORE</h4><p>Old pain</p></div>
  <div class="ba-card after"><h4>✅ AFTER</h4><p>New behavior</p></div>
</div>
```

### Callout
```html
<div class="callout"> <!-- 2px left border = red accent -->
  <strong>Key insight:</strong> Explanation text
</div>
```

### ASCII Box / File Table / Review Notes
Same structure as before. All use `--surface` bg, `--border` 1px solid, mono labels.

## Motion (3 features)

1. **Nav highlight** — IntersectionObserver swaps `.active` class
2. **Scroll-linked h1** — `scale(1 - scrollY/600 * 0.11)` shrink on scroll
3. **Entrance animations** — `.anim` class added via JS, `.visible` on intersect

## Responsive

- Below 700px: container 16px padding
- Below 600px: stats 2-col, before-after single-col
- Fonts: ZTNature/Inter (display+body), JetBrains Mono (labels)

## Color Mapping

| Name | CSS Var | Dim | Use |
|------|---------|-----|-----|
| red | `--coral` | `--coral-dim` | Singular pop accent |
| green | `--green` | `--green-dim` | Additions, success |
| muted | `--indigo` | `--indigo-dim` | Secondary (gray) |
| red | `--red` | `--red-dim` | Deletions, errors |
