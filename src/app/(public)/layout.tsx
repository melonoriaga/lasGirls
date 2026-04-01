import { FilmGrain } from "@/components/layout/film-grain";
import type { PropsWithChildren } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <FilmGrain />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
