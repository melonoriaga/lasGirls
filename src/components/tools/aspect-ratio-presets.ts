import type { Locale } from "@/i18n/messages";

export type AspectFormatPreset = {
  platform: string;
  label: string;
  w: number;
  h: number;
  note?: string;
};

const ASPECT_FORMATS_ES: AspectFormatPreset[] = [
  { platform: "Instagram", label: "Feed cuadrado", w: 1080, h: 1080 },
  { platform: "Instagram", label: "Feed horizontal", w: 1080, h: 566, note: "1.91:1" },
  { platform: "Instagram", label: "Feed retrato", w: 1080, h: 1350, note: "4:5 — recomendado" },
  { platform: "Instagram", label: "Stories & Reels", w: 1080, h: 1920, note: "9:16" },
  {
    platform: "Instagram",
    label: "Story zona segura",
    w: 1080,
    h: 1920,
    note: "área útil: 1080×1420",
  },
  { platform: "TikTok", label: "Video vertical", w: 1080, h: 1920, note: "9:16" },
  { platform: "TikTok", label: "Feed cuadrado", w: 1080, h: 1080 },
  { platform: "YouTube", label: "Thumbnail HD", w: 1280, h: 720, note: "16:9 mínimo" },
  { platform: "YouTube", label: "Thumbnail Full", w: 1920, h: 1080 },
  { platform: "YouTube", label: "Shorts", w: 1080, h: 1920, note: "9:16" },
  { platform: "YouTube", label: "Banner canal", w: 2560, h: 1440, note: "safe: 1546×423" },
  { platform: "X / Twitter", label: "Post imagen", w: 1200, h: 675, note: "16:9" },
  { platform: "X / Twitter", label: "Header", w: 1500, h: 500, note: "3:1" },
  { platform: "X / Twitter", label: "Avatar", w: 400, h: 400 },
  { platform: "LinkedIn", label: "Post imagen", w: 1200, h: 628, note: "1.91:1" },
  { platform: "LinkedIn", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "LinkedIn", label: "Banner perfil", w: 1584, h: 396, note: "4:1" },
  { platform: "LinkedIn", label: "Logo empresa", w: 300, h: 300 },
  { platform: "Facebook", label: "Post imagen", w: 1200, h: 630 },
  { platform: "Facebook", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "Facebook", label: "Cover", w: 820, h: 312 },
  { platform: "Pinterest", label: "Pin estándar", w: 1000, h: 1500, note: "2:3 — recomendado" },
  { platform: "Pinterest", label: "Pin cuadrado", w: 1000, h: 1000 },
  { platform: "Web", label: "Banner leaderboard", w: 728, h: 90 },
  { platform: "Web", label: "Banner medium rect", w: 300, h: 250 },
  { platform: "Web", label: "Hero 16:9", w: 1920, h: 1080 },
  { platform: "Web", label: "Open Graph", w: 1200, h: 630, note: "meta redes / preview" },
];

const ASPECT_FORMATS_EN: AspectFormatPreset[] = [
  { platform: "Instagram", label: "Square feed post", w: 1080, h: 1080 },
  { platform: "Instagram", label: "Horizontal feed art", w: 1080, h: 566, note: "1.91:1" },
  { platform: "Instagram", label: "Portrait feed art", w: 1080, h: 1350, note: "4:5 — recommended" },
  { platform: "Instagram", label: "Stories & Reels", w: 1080, h: 1920, note: "9:16" },
  {
    platform: "Instagram",
    label: "Story safe zone",
    w: 1080,
    h: 1920,
    note: "usable area ~1080×1420 px",
  },
  { platform: "TikTok", label: "Vertical video", w: 1080, h: 1920, note: "9:16" },
  { platform: "TikTok", label: "Square feed", w: 1080, h: 1080 },
  { platform: "YouTube", label: "Thumbnail HD baseline", w: 1280, h: 720, note: "16:9 minimum" },
  { platform: "YouTube", label: "Thumbnail Full HD canvas", w: 1920, h: 1080 },
  { platform: "YouTube", label: "Shorts", w: 1080, h: 1920, note: "9:16" },
  { platform: "YouTube", label: "Channel banner", w: 2560, h: 1440, note: "safe: 1546×423 px" },
  { platform: "X / Twitter", label: "In-feed photo", w: 1200, h: 675, note: "16:9" },
  { platform: "X / Twitter", label: "Header", w: 1500, h: 500, note: "3:1" },
  { platform: "X / Twitter", label: "Avatar", w: 400, h: 400 },
  { platform: "LinkedIn", label: "Link share image", w: 1200, h: 628, note: "1.91:1" },
  { platform: "LinkedIn", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "LinkedIn", label: "Profile banner", w: 1584, h: 396, note: "4:1" },
  { platform: "LinkedIn", label: "Company logo block", w: 300, h: 300 },
  { platform: "Facebook", label: "Link share image", w: 1200, h: 630 },
  { platform: "Facebook", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "Facebook", label: "Page cover photo", w: 820, h: 312 },
  { platform: "Pinterest", label: "Standard Pin", w: 1000, h: 1500, note: "2:3 — recommended" },
  { platform: "Pinterest", label: "Square Pin", w: 1000, h: 1000 },
  { platform: "Web", label: "Leaderboard banner", w: 728, h: 90 },
  { platform: "Web", label: "Medium rectangle banner", w: 300, h: 250 },
  { platform: "Web", label: "16:9 hero still", w: 1920, h: 1080 },
  { platform: "Web", label: "Open Graph social preview", w: 1200, h: 630, note: "meta cards" },
];

export function aspectFormats(locale: Locale): AspectFormatPreset[] {
  return locale === "en" ? ASPECT_FORMATS_EN : ASPECT_FORMATS_ES;
}
