/* graph-palettes.js
   Small palette generator and theme applier.
   Adds Ge.generatePalette(baseHex, opts) and Ge.applyPalette(paletteObject, target)
   - baseHex: '#RRGGBB' or 'RRGGBB'
   - opts: { variant: 'complement'|'analogous'|'triadic'|'monochrome', lightSurface: bool }
   Returns an object mapping CSS variables suitable for Ge.setTheme / CSS injection.
*/

(function(global){
  const Ge = global.Ge || (global.Ge = {});

  // --- Color helpers (small, dependency-free) ---
  function clamp(v, a=0, b=1){ return Math.min(b, Math.max(a, v)); }
  function hexToRgb(hex) {
    hex = hex.replace('#','').trim();
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const int = parseInt(hex, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }
  function rgbToHex(r,g,b){
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0, s=0, l = (max+min)/2;
    if (max !== min) {
      const d = max-min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h*360, s: s*100, l: l*100 };
  }
  function hslToRgb(h,s,l){
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h / 360;
    const t = [hk + 1/3, hk, hk - 1/3];
    const rgb = t.map(tc => {
      if (tc < 0) tc += 1;
      if (tc > 1) tc -= 1;
      if (tc < 1/6) return p + (q - p) * 6 * tc;
      if (tc < 1/2) return q;
      if (tc < 2/3) return p + (q - p) * (2/3 - tc) * 6;
      return p;
    });
    return { r: Math.round(rgb[0]*255), g: Math.round(rgb[1]*255), b: Math.round(rgb[2]*255) };
  }

  function luminance(r,g,b){
    // relative luminance (0..1)
    const sRGB = [r/255,g/255,b/255].map(v => {
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return 0.2126*sRGB[0] + 0.7152*sRGB[1] + 0.0722*sRGB[2];
  }

  // rotate hue helper
  function rotate(h, deg){ return (h + deg + 360) % 360; }

  // --- Palette generation ---
  Ge.generatePalette = function(baseHex, opts = {}) {
    opts = Object.assign({ variant: 'analogous', lightSurface: false }, opts);
    const rgb = hexToRgb(baseHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let accent2Hue;

    switch(opts.variant){
      case 'complement': accent2Hue = rotate(hsl.h, 180); break;
      case 'triadic': accent2Hue = rotate(hsl.h, 120); break;
      case 'monochrome': accent2Hue = hsl.h; break;
      case 'analogous':
      default: accent2Hue = rotate(hsl.h, 30); break;
    }

    // Derived colors
    const accent = rgbToHex(...Object.values(hslToRgb(hsl.h, Math.max(28,hsl.s*0.9), Math.min(60, hsl.l+4))));
    const accent2 = rgbToHex(...Object.values(hslToRgb(accent2Hue, Math.max(26, hsl.s*0.8), Math.min(60, hsl.l+4))));
    const accent3 = rgbToHex(...Object.values(hslToRgb(hsl.h, Math.max(18, hsl.s*0.6), Math.min(85, hsl.l+28))));
    const accent4 = rgbToHex(...Object.values(hslToRgb(rotate(hsl.h, -40), Math.max(22, hsl.s*0.7), Math.max(18, hsl.l-12))));

    // Surface / foreground choices based on base color luminance
    const lum = luminance(rgb.r, rgb.g, rgb.b);
    const dark = lum > 0.45 ? false : true;

    const bg = opts.lightSurface ? '#fbfdff' : (dark ? '#071428' : '#0b1220');
    const surface = opts.lightSurface ? '#ffffff' : (dark ? '#071a2a' : '#0b1220');

    // Foreground: ensure contrast
    const fg = dark ? '#eaf6ff' : '#0b1220';
    const muted = dark ? '#97acc2' : '#6b7684';
    const grid = dark ? 'rgba(255,255,255,0.04)' : 'rgba(11,17,32,0.04)';

    const palette = {
      '--g-accent': accent,
      '--g-accent-2': accent2,
      '--g-accent-3': accent3,
      '--g-accent-4': accent4,
      '--g-bg': bg,
      '--g-surface': surface,
      '--g-foreground': fg,
      '--g-muted': muted,
      '--g-grid': grid
    };
    return palette;
  };

  // Apply palette object to target (document.documentElement or a container element)
  Ge.applyPalette = function(palette, target) {
    target = target || document.documentElement;
    Object.keys(palette || {}).forEach(k => {
      target.style.setProperty(k, palette[k]);
    });
  };

  // Convenience: generate + apply
  Ge.generateAndApply = function(baseHex, opts, target){
    const p = Ge.generatePalette(baseHex, opts);
    Ge.applyPalette(p, target);
    return p;
  };

  // Small helper to toggle theme classes (keeps CSS theme classes available too)
  Ge.toggleThemeClass = function(name, container){
    container = container || document.documentElement;
    ['ge-theme-dark','ge-theme-light','ge-theme-pastel','ge-theme-corporate'].forEach(c => container.classList.remove(c));
    if (name) container.classList.add(name);
  };

  // Expose
  global.Ge = Ge;
})(window);
