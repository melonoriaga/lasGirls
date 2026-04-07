/** Utilidades de color compartidas (generador de paleta). */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h =
      max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function textColor(hex: string): string {
  return luminance(hex) > 0.35 ? "#111111" : "#FFFFFF";
}

export function generateTints(hex: string, steps = 9): string[] {
  const [r, g, b] = hexToRgb(hex);
  return Array.from({ length: steps }, (_, i) => {
    const t = (steps - i) / (steps + 1);
    return rgbToHex(r + (255 - r) * (1 - t), g + (255 - g) * (1 - t), b + (255 - b) * (1 - t));
  });
}

export function generateShades(hex: string, steps = 9): string[] {
  const [r, g, b] = hexToRgb(hex);
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / (steps + 1);
    return rgbToHex(r * (1 - t), g * (1 - t), b * (1 - t));
  });
}

export function generateComplementary(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hslToHex((h + 180) % 360, s, l)];
}

export function generateAnalogous(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hslToHex((h + 30) % 360, s, l), hslToHex((h - 30 + 360) % 360, s, l)];
}

export function generateTriadic(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
}

export function isValidHex(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

export function normalizeHexInput(raw: string): string {
  const v = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
  return v.slice(0, 7);
}
