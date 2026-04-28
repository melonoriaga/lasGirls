import type { Metadata } from "next";
import { TeamLandingContent } from "@/components/team/team-landing";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Equipo / Team · Las Girls+",
  description:
    "Jean, Mel y una red de especialistas para cada proyecto. Crew extendido: branding, tech, producto y contenido.",
  path: "/team",
});

export default function TeamPage() {
  return <TeamLandingContent />;
}
