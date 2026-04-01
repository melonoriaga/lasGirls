import type { Metadata } from "next";
import Link from "next/link";
import { jeanProfile } from "@/content/team/jean";
import { melProfile } from "@/content/team/mel";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Equipo | Las Girls+",
  description: "Conocé a Jean, Mel y la red de especialistas que acompaña cada proyecto.",
  path: "/team",
});

const members = [jeanProfile, melProfile];

export default function TeamPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">Team</h1>
        <p className="mt-4 max-w-3xl text-zinc-700">
          Jean y Mel son la cara visible de Las Girls+. Según cada desafío, sumamos una red de
          especialistas en desarrollo, diseño, branding, social media, contenido y audiovisual.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <article key={member.slug} className="border border-black bg-white p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-600">{member.roleTitle}</p>
              <h2 className="mt-2 font-display text-4xl uppercase">{member.fullName}</h2>
              <p className="mt-3 text-sm text-zinc-700">{member.shortBio}</p>
              <Link href={`/team/${member.slug}`} className="mt-4 inline-block text-sm underline">
                Ver perfil
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
