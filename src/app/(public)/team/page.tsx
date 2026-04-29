import type { Metadata } from "next";
import { TeamEditorialLanding } from "@/components/team/editorial/team-editorial-landing";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Equipo / Team · Las Girls+",
  description:
    "Jean, Mel y una red de especialistas para cada proyecto. Crew extendido: branding, tech, producto y contenido.",
  path: "/team",
  image: "/seo/team.jpeg",
  imageAlt: "Team Las Girls+",
});

export default function TeamPage() {
  return <TeamEditorialLanding />;
}
