# Graph Engine — Themes, Palette Generator & Integrations

This document describes the new additions:
- Theme presets: .ge-theme-dark, .ge-theme-light, .ge-theme-pastel, .ge-theme-corporate
- Palette generator: Ge.generatePalette / Ge.applyPalette / Ge.generateAndApply
- Integrations: D3 (SVG) and Chart.js (Canvas)

Where the files live
- styles/graph-themes.css — theme class presets
- js/graph-palettes.js — palette generator and helpers
- js/d3-integration.js + demo/d3-demo.html — D3 example (requires D3 v7)
- js/chartjs-integration.js + demo/chartjs-demo.html — Chart.js example (requires Chart.js v4+)

Quick usage
1. Loading
   Include base engine CSS + theme CSS and helpers:
   <link rel="stylesheet" href="styles/graph-engine.css">
   <link rel="stylesheet" href="styles/graph-themes.css">
   <script src="js/graph-engine.js"></script>
   <script src="js/graph-palettes.js"></script>

2. Applying a theme preset (CSS class)
   document.body.classList.add('ge-theme-dark');

3. Generating a palette programmatically
   const palette = Ge.generatePalette('#7c5cff', { variant: 'triadic', lightSurface: false });
   Ge.applyPalette(palette); // applies to :root
   // or combine:
   Ge.generateAndApply('#4dd0e1', { variant: 'analogous' });

4. D3 integration (SVG)
   - Include D3 (v7).
   - Use Ge.d3.createLineChart(svgElement, data, options).
   - Chart is responsive and uses Ge.attachTooltip.
   - Example in demo/d3-demo.html.

5. Chart.js integration (Canvas)
   - Include Chart.js (v4+).
   - Use Ge.chartjs.initChart(canvas, data, opts).
   - Colors are read from CSS variables so theme and palette changes reflect on chart visuals.
   - Example in demo/chartjs-demo.html.

Design notes & best practices
- The palette generator is intentionally simple and deterministic — it returns colors tuned for graph usage (accent, accent-2, accent-3, accent-4) and surface/foreground choices.
- For production, consider integrating a color-contrast library if you need WCAG guarantees for every possible base color.
- For very large or realtime datasets:
  - Prefer SVG + WebGL or Canvas for heavy rendering; this engine focuses on polished presentation.
  - Keep animations GPU-friendly (transform, opacity, stroke-dashoffset).
- For Chart.js, reapply dataset colors after calling Ge.generateAndApply (see demos).

Next steps / optional enhancements
- Add a tiny UI palette editor that exposes hue/saturation/lightness sliders and live-exports CSS variables.
- Add server-side SASS/LESS ingredients (tokens) to generate theme CSS for your design system.
- Provide an npm package with TypeScript definitions and rollup build.

If you want, I can:
- Convert everything into an npm package (package.json, build scripts, minified assets).
- Add a small UI for generating palettes visually and exporting tokens.
- Add more deep integrations: Vega-Lite, Highcharts, or react bindings (React hooks + components).
