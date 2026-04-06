"use client";

import Link from "next/link";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { changelogQueryString, type ChangelogFiltersInput } from "@/lib/admin/changelog-filters";

type Props = {
  page: number;
  totalPages: number;
  filters: ChangelogFiltersInput;
};

export function ChangelogPagination({ page, totalPages, filters }: Props) {
  const suffix = changelogQueryString(filters);
  const href = (p: number) => `/admin/changelog?page=${p}${suffix}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={href(Math.max(1, page - 1))}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
          page <= 1
            ? "pointer-events-none border-zinc-200 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        <RiArrowLeftSLine className="size-4 shrink-0" aria-hidden />
        Anterior
      </Link>
      <Link
        href={href(Math.min(totalPages, page + 1))}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
          page >= totalPages
            ? "pointer-events-none border-zinc-200 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        Siguiente
        <RiArrowRightSLine className="size-4 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}
