// Convert hex to HSL and back for easier manipulation
// We'll use a simple implementation or rely on string manipulation for HSL

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function hexToHSL(hex: string): HSL {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0, s = 0, l = 0;
  
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  
  return { h, s, l };
}

export function hslToHex(hsl: HSL): string {
  let { h, s, l } = hsl;
  s /= 100;
  l /= 100;
  
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Generates a random color palette based on a seed hue or completely random.
 * Ensures colors are vibrant and harmonious (e.g., analogous, complementary).
 */
export function generateHarmoniousColors(baseHue?: number): string[] {
  const hue = baseHue ?? Math.floor(Math.random() * 360);
  
  // Strategy: Analogous + 1 Complementary accent
  // Saturation: High (60-90%) for vibrancy
  // Lightness: Varied (40-70%)
  
  const s = () => 60 + Math.random() * 30; // 60-90
  const l = () => 40 + Math.random() * 30; // 40-70
  
  const colors = [
    hslToHex({ h: hue, s: s(), l: l() }), // Base
    hslToHex({ h: (hue + 30) % 360, s: s(), l: l() }), // Analogous 1
    hslToHex({ h: (hue - 30 + 360) % 360, s: s(), l: l() }), // Analogous 2
    hslToHex({ h: (hue + 180) % 360, s: s(), l: l() }), // Complementary
  ];
  
  return colors;
}

/**
 * Generates a background color that fits the palette (usually very dark or very light)
 */
export function generateBackgroundColor(baseHue: number, isDark = true): string {
    const s = 20 + Math.random() * 20; // Low saturation
    const l = isDark ? 5 + Math.random() * 10 : 90 + Math.random() * 8; // Very dark or very light
    return hslToHex({ h: baseHue, s, l });
}
