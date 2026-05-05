"use client";

import type { ReactNode } from "react";

/** Matches http(s) URLs; stops at whitespace or angle brackets. */
const HTTP_URL_RE = /https?:\/\/[^\s<>]+/gi;

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[)\].,;:!?]+$/u, "");
}

export function LinkifiedText({
  text,
  className,
  linkClassName,
}: {
  text: string;
  className?: string;
  /** Override anchor styles (e.g. dark surfaces). */
  linkClassName?: string;
}) {
  const defaultLink =
    "break-words font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800";
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(HTTP_URL_RE.source, HTTP_URL_RE.flags);
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const start = m.index;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    const href = stripTrailingPunctuation(raw);
    if (/^https?:\/\//i.test(href)) {
      nodes.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName ?? defaultLink}
        >
          {href}
        </a>,
      );
    } else {
      nodes.push(raw);
    }
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}
