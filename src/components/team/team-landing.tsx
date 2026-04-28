"use client";

import Link from "next/link";
import { editorialMembers } from "@/content/team/editorial-members";
import { resolveEditorialMember } from "@/content/team/resolve-editorial-member";
import { useLocale } from "@/i18n/locale-provider";
import { dictionaries } from "@/i18n/messages";

export function TeamLandingContent() {
  const { locale } = useLocale();
  const pg = dictionaries[locale].teamPage;

  return (
    <>
      <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#111] px-4 py-20 text-[#f4ede6] md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex bg-[#ff5faf] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">{pg.badge}</p>
          <h1 className="mt-6 font-display text-[15vw] uppercase leading-[0.84] text-[#f4ede6] md:text-[8rem]">{pg.headline}</h1>
          <p className="mt-4 max-w-3xl text-[#f4ede6]/75">{pg.intro}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {editorialMembers.map((member) => {
              const m = resolveEditorialMember(member, locale);
              return (
              <article key={member.slug} className="border-2 border-[#f4ede6] bg-[#1a1a1a] p-6">
                <p className="text-xs uppercase tracking-wider text-[#ff9ccc]">{m.roleLabel}</p>
                <h2 className="mt-2 font-display text-4xl uppercase">{m.fullName}</h2>
                <p className="mt-3 text-sm text-[#f4ede6]/75">{m.tagline}</p>
                <Link
                  href={`/team/${member.slug}`}
                  className="mt-4 inline-block text-sm uppercase tracking-[0.08em] text-[#ff5faf] underline"
                >
                  {pg.profileCta}
                </Link>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b-2 border-black bg-[#F4EDE6] px-4 py-20 text-[#111] md:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-[#111]/45">{pg.extendedEyebrow}</p>
          <h2 className="max-w-3xl font-display text-3xl uppercase leading-[0.92] md:text-4xl">{pg.extendedLead}</h2>
          <div className="max-w-3xl space-y-5 text-[0.97rem] leading-relaxed text-[#111]/78">
            <p>{pg.extendedBody1}</p>
            <p className="text-[1.05rem] font-semibold tracking-tight text-[#111]">{pg.extendedBody2}</p>
            <p>{pg.extendedBody3}</p>
            <p>{pg.extendedBody4}</p>
          </div>
        </div>
      </section>
    </>
  );
}
