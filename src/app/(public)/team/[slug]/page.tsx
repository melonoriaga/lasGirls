import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { jeanProfile } from "@/content/team/jean";
import { melProfile } from "@/content/team/mel";
import { buildMetadata } from "@/lib/seo/metadata";

const members = {
  jean: jeanProfile,
  mel: melProfile,
};

type Props = {
  params: Promise<{ slug: "jean" | "mel" }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = members[slug];
  if (!member) {
    return buildMetadata({
      title: "Perfil | Las Girls+",
      description: "Perfil del equipo.",
      path: `/team/${slug}`,
    });
  }
  return buildMetadata({
    title: `${member.fullName} | Las Girls+`,
    description: member.shortBio,
    path: `/team/${slug}`,
  });
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const member = members[slug];
  if (!member) notFound();

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-4xl border border-black bg-white p-8">
        <p className="text-xs uppercase tracking-widest">{member.roleTitle}</p>
        <h1 className="mt-2 font-display text-5xl uppercase md:text-7xl">{member.fullName}</h1>
        <p className="mt-4 text-zinc-700">{member.shortBio}</p>
        <p className="mt-4 text-sm text-zinc-700">{member.longBio}</p>
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider">Especialidades</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {member.specialties.map((item) => (
            <li key={item} className="border border-black/70 px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
