import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamMemberEditorial } from "@/components/team/team-member-editorial";
import { editorialMembers, editorialMembersBySlug } from "@/content/teamSetup/editorial-members";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ slug: "jean" | "mel" }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = editorialMembersBySlug[slug];
  if (!member) {
    return buildMetadata({
      title: "Perfil | Las Girls+",
      description: "Perfil del equipo.",
      path: `/team/${slug}`,
    });
  }
  return buildMetadata({
    title: `${member.fullName} | Las Girls+`,
    description: member.tagline,
    path: `/team/${slug}`,
    image: member.image,
  });
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const member = editorialMembersBySlug[slug];
  if (!member) notFound();

  const others = editorialMembers.filter((item) => item.slug !== slug);
  return <TeamMemberEditorial member={member} others={others} />;
}
