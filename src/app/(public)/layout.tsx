import { FilmGrain } from "@/components/layout/film-grain";
import type { PropsWithChildren } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PublicBreadcrumb } from "@/components/layout/public-breadcrumb";
import { ToolsTeaser } from "@/components/tools/tools-teaser";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <FilmGrain />
      <Navbar />
      <main>
        <PublicBreadcrumb />
        {children}
      </main>
      <ToolsTeaser />
      <Footer />
    </>
  );
}
