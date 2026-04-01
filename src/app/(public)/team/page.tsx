import type { Metadata } from "next";
import Link from "next/link";
import { editorialMembers } from "@/content/team/editorial-members";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Equipo | Las Girls+",
  description: "Conocé a Jean, Mel y la red de especialistas que acompaña cada proyecto.",
  path: "/team",
});

const members = editorialMembers;

export default function TeamPage() {
  return (
    <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#111] px-4 py-20 text-[#f4ede6] md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex bg-[#ff5faf] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">equipo</p>
        <h1 className="mt-6 font-display text-[15vw] uppercase leading-[0.84] text-[#f4ede6] md:text-[8rem]">Team</h1>
        <p className="mt-4 max-w-3xl text-[#f4ede6]/75">
          Jean y Mel son la cara visible de Las Girls+. Según cada desafío, sumamos una red de
          especialistas en desarrollo, diseño, branding, social media, contenido y audiovisual.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <article key={member.slug} className="border-2 border-[#f4ede6] bg-[#1a1a1a] p-6">
              <p className="text-xs uppercase tracking-wider text-[#ff9ccc]">{member.roleLabel}</p>
              <h2 className="mt-2 font-display text-4xl uppercase">{member.fullName}</h2>
              <p className="mt-3 text-sm text-[#f4ede6]/75">{member.tagline}</p>
              <Link href={`/team/${member.slug}`} className="mt-4 inline-block text-sm uppercase tracking-[0.08em] text-[#ff5faf] underline">
                Ver perfil
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
