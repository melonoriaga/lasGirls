import type { Locale } from "@/i18n/messages";
import { dictionaries } from "@/i18n/messages";
import { Palette, QrCode, RatioIcon, type LucideIcon } from "lucide-react";

export type ToolSlug = "qr" | "paleta" | "aspect-ratio";

export type ToolEntry = {
  slug: ToolSlug;
  icon: LucideIcon;
};

const ICONS: Record<ToolSlug, LucideIcon> = {
  qr: QrCode,
  paleta: Palette,
  "aspect-ratio": RatioIcon,
};

function dictKey(slug: ToolSlug): "qr" | "paleta" | "aspect" {
  if (slug === "aspect-ratio") return "aspect";
  return slug;
}

export function getToolsForLocale(locale: Locale): (ToolEntry & { name: string; desc: string; detail: string; tag: string })[] {
  const toolTag = toolStrings(locale).toolTagFree;
  const slugs: ToolSlug[] = ["qr", "paleta", "aspect-ratio"];
  return slugs.map((slug) => {
    const k = dictKey(slug);
    const block = dictionaries[locale].tools[k] as {
      name: string;
      desc: string;
      detail: string;
    };
    return {
      slug,
      icon: ICONS[slug],
      name: block.name,
      desc: block.desc,
      detail: block.detail,
      tag: toolTag,
    };
  });
}

export type ToolHubStrings = {
  hubEyebrow: string;
  hubAccent: string;
  hubIntro: string;
  hubCountSuffix: string;
  hubUseBtn: string;
  hubFooterLead: string;
  hubFooterContact: string;
  toolTagFree: string;
};

export function toolStrings(locale: Locale): ToolHubStrings {
  const T = dictionaries[locale].tools as unknown as Record<string, string>;
  return {
    hubEyebrow: T.hubEyebrow ?? "",
    hubAccent: T.hubAccent ?? "",
    hubIntro: T.hubIntro ?? "",
    hubCountSuffix: T.hubCountSuffix ?? "",
    hubUseBtn: T.hubUseBtn ?? "",
    hubFooterLead: T.hubFooterLead ?? "",
    hubFooterContact: T.hubFooterContact ?? "",
    toolTagFree: T.toolTagFree ?? "GRATIS",
  };
}

