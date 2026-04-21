"use client";

import { BackToHeroFab } from "@/components/layout/back-to-hero-fab";
import { ContactSection } from "@/components/sections/contact-section";
import { HomeHeroSection } from "@/components/sections/home-hero-section";
import { HomeTeamSection } from "@/components/sections/home-team-section";
import { IdeaReadyImpactSection } from "@/components/sections/idea-ready-impact-section";
import { LanyardCardSection } from "@/components/sections/lanyard-card-section";
import { MethodologyFeed } from "@/components/sections/methodology-feed";
import { ServicesShowcaseSection } from "@/components/sections/services-showcase-section";

export default function HomePage() {
  return (
    <>
      <HomeHeroSection />
      <BackToHeroFab />

      <IdeaReadyImpactSection />

      <MethodologyFeed />

      <ServicesShowcaseSection />

      <HomeTeamSection />

      <LanyardCardSection />

      <ContactSection id="contacto" />
    </>
  );
}
