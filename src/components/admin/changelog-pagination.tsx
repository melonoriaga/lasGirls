"use client";

import Link from "next/link";
import { changelogQueryString, type ChangelogFiltersInput } from "@/lib/admin/changelog-filters";

type Props = {
  page: number;
  totalPages: number;
  filters: ChangelogFiltersInput;
  pageSize: number;
};

export function ChangelogPagination({ page, totalPages, filters, pageSize }: Props) {
  const suffix = changelogQueryString(filters);
  const href = (p: number, s = pageSize) => `/admin/changelog?page=${p}&pageSize=${s}${suffix}`;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const pageButtons = (() => {
    const span = 2;
    const from = Math.max(1, page - span);
    const to = Math.min(totalPages, page + span);
    const pages: number[] = [];
    for (let n = from; n <= to; n += 1) pages.push(n);
    return pages;
  })();

  return (
    <nav aria-label="Paginación changelog" className="flex flex-wrap items-center gap-3">
      <ul className="flex -space-x-px text-sm">
        <li>
          <Link
            href={href(Math.max(1, page - 1))}
            className={`flex h-9 items-center justify-center rounded-s-lg border border-zinc-300 px-3 text-sm ${
              hasPrev ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "pointer-events-none bg-zinc-100 text-zinc-400"
            }`}
          >
            Previous
          </Link>
        </li>
        {pageButtons.map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-current={n === page ? "page" : undefined}
              className={
                n === page
                  ? "flex h-9 w-9 items-center justify-center border border-zinc-300 bg-zinc-200 text-sm font-semibold text-zinc-900"
                  : "flex h-9 w-9 items-center justify-center border border-zinc-300 bg-zinc-100 text-sm text-zinc-700 hover:bg-zinc-200"
              }
            >
              {n}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={href(Math.min(totalPages, page + 1))}
            className={`flex h-9 items-center justify-center rounded-e-lg border border-zinc-300 px-3 text-sm ${
              hasNext ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "pointer-events-none bg-zinc-100 text-zinc-400"
            }`}
          >
            Next
          </Link>
        </li>
      </ul>

      <form className="w-32">
        <label htmlFor="changelog-per-page" className="sr-only">
          Items por página
        </label>
        <select
          id="changelog-per-page"
          className="block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800"
          value={pageSize}
          onChange={(e) => {
            window.location.href = href(1, Number(e.target.value));
          }}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </form>
    </nav>
  );
}
