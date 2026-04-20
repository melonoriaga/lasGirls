"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import type { EditorialTeamMember } from "@/content/team/editorial-members";

const BEIGE = "#F4EDE6";
const INK = "#111111";
const PINK = "#FF6FAF";

function Label({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-body), sans-serif",
        fontSize: "clamp(0.44rem,.62vw,.54rem)",
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: INK,
        opacity: 0.38,
      }}
    >
      {children}
    </span>
  );
}

type Props = {
  member: EditorialTeamMember;
  others: EditorialTeamMember[];
};

export function TeamMemberEditorial({ member, others }: Props) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [member.slug]);

  const headlineLines = member.headline.split("\n");

  /** Sentence-style casing for pink accent spans (never force ALL CAPS in cursive). */
  const sentenceCaseAccent = (s: string): string => {
    const t = s.trim().toLowerCase();
    if (!t) return s;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const renderLine = (line: string) => {
    const parts = line.split(/(\[\[.*?\]\])/g);
    if (parts.length === 1) return line;

    return parts.map((part, idx) => {
      const match = part.match(/^\[\[(.*?)\]\]$/);
      if (match)
        return (
          <span key={idx} style={{ color: PINK }}>
            {sentenceCaseAccent(match[1])}
          </span>
        );
      return <span key={idx} style={{ color: INK }}>{part}</span>;
    });
  };

  return (
    <div style={{ background: BEIGE, minHeight: "100vh" }}>
      <style>{`
        .tm-back { transition: color .18s, border-color .18s; }
        .tm-back:hover { color: ${PINK} !important; border-color: ${PINK} !important; }
        .tm-other { transition: opacity .2s, transform .25s; }
        .tm-other:hover { opacity: 1 !important; transform: translateY(-5px) !important; }
        .tm-cta-main:hover { background: ${PINK} !important; color: #fff !important; border-color: ${PINK} !important; }
        .tm-cta-sec:hover  { background: ${INK} !important; color: ${BEIGE} !important; }

        @media (max-width: 700px) {
          .tm-hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .tm-hero-left { border-right: none !important; border-bottom: 1px solid rgba(17,17,17,0.12); padding: 2rem 1.5rem !important; }
          .tm-hero-img { min-height: 65vw !important; max-height: 65vw !important; }
          .tm-bio-grid { grid-template-columns: 1fr !important; }
          .tm-bio-side { display: none !important; }
          .tm-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .tm-stat-cell { padding: 1.5rem 1rem !important; }
          .tm-others-grid { grid-template-columns: 1fr !important; }
          .tm-cta-btns { flex-direction: column !important; }
          .tm-cta-btns button { width: 100% !important; }
        }

        @media (max-width: 420px) {
          .tm-stats-grid { grid-template-columns: 1fr !important; }
          .tm-stat-cell { border-right: none !important; border-bottom: 1px solid rgba(17,17,17,0.12) !important; }
        }
      `}</style>

      <div
        className="tm-hero-grid"
        style={{
          paddingTop: "clamp(4.8rem,9vh,6rem)",
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr clamp(280px, 42%, 560px)",
          borderBottom: "1px solid rgba(17,17,17,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          className="tm-hero-left"
          style={{
            padding: "clamp(3rem,6vh,6rem) clamp(1.5rem,5vw,4rem)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(17,17,17,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 32, height: 1.5, background: INK, opacity: 0.25 }} />
            <Label>{member.roleLabel}</Label>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(2rem,5vh,4rem) 0" }}
          >
            {headlineLines.map((line, i) => (
              <div
                key={`${line}-${i}`}
                style={{
                  fontFamily: i === headlineLines.length - 1 ? "var(--font-accent), cursive" : "var(--font-display), sans-serif",
                  fontSize: "clamp(3.5rem,9.5vw,9.5rem)",
                  lineHeight: 0.87,
                  letterSpacing: "-0.025em",
                  textTransform: i === headlineLines.length - 1 ? "none" : "uppercase",
                  color: i === headlineLines.length - 1 ? PINK : INK,
                }}
              >
                {line.includes("[[") ? renderLine(line) : line}
              </div>
            ))}

            <div
              style={{
                fontFamily: "var(--font-accent), cursive",
                fontSize: "clamp(1.1rem,2.2vw,1.75rem)",
                color: PINK,
                marginTop: "clamp(1rem,2.5vh,2rem)",
                textTransform: "none",
              }}
            >
              {member.tagline}
            </div>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label>ESPECIALIDADES</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
              {member.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontFamily: "var(--font-body), sans-serif",
                    fontSize: "clamp(0.52rem,.74vw,.62rem)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: INK,
                    opacity: 0.5,
                    border: "1px solid rgba(17,17,17,0.2)",
                    padding: "0.2rem 0.55rem",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="tm-hero-img"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.15 }}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            background: BEIGE,
            minHeight: "calc(100vh - 52px)",
          }}
        >
          <img
            src={member.image}
            alt={member.name}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
              mixBlendMode: member.blendMultiply ? "multiply" : "normal",
              maxHeight: "calc(100vh - 52px)",
            }}
          />
          <div style={{ position: "absolute", top: "clamp(1rem,3vh,2.5rem)", right: "clamp(1rem,2.5vw,2rem)", fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(5rem,12vw,10rem)", lineHeight: 1, color: INK, opacity: 0.04, userSelect: "none", pointerEvents: "none" }}>
            0{member.id === "jean" ? "1" : "2"}
          </div>
        </motion.div>
      </div>

      <div className="tm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid rgba(17,17,17,0.12)" }}>
        {[
          { n: "10+", label: "ANOS DE EXPERIENCIA" },
          { n: "100+", label: "MARCAS" },
          { n: "5+", label: "EN EL EQUIPO" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="tm-stat-cell"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ padding: "clamp(2rem,4vh,3.5rem) clamp(1.5rem,4vw,3.5rem)", borderRight: i < 2 ? "1px solid rgba(17,17,17,0.12)" : "none" }}
          >
            <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(2.5rem,5.5vw,5rem)", lineHeight: 1, color: INK, letterSpacing: "-0.02em" }}>
              {stat.n}
            </div>
            <div style={{ marginTop: "0.4rem" }}>
              <Label>{stat.label}</Label>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="tm-bio-grid" style={{ display: "grid", gridTemplateColumns: "clamp(80px,18%,220px) 1fr", borderBottom: "1px solid rgba(17,17,17,0.12)" }}>
        <div className="tm-bio-side" style={{ borderRight: "1px solid rgba(17,17,17,0.12)", padding: "clamp(2.5rem,5vh,4.5rem) clamp(1rem,2vw,1.8rem)", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(2rem,5vw,4.5rem)", lineHeight: 0.88, letterSpacing: "-0.02em", textTransform: "uppercase", color: INK, opacity: 0.08, writingMode: "vertical-rl", transform: "rotate(180deg)", userSelect: "none" }}>
            SOBRE {member.name}
          </div>
        </div>

        <div style={{ padding: "clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,5vw,5rem)", display: "flex", flexDirection: "column", gap: "clamp(1.2rem,2.5vh,2rem)" }}>
          <Label>BIO ✦ {member.name}</Label>
          {member.bio.map((paragraph, i) => (
            <motion.p
              key={`${member.id}-bio-${i}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.12 }}
              style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.88rem,1.15vw,1.05rem)", color: INK, lineHeight: 1.8, margin: 0, opacity: 0.7 }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }} style={{ padding: "clamp(4rem,10vh,8rem) clamp(1.5rem,8vw,10rem)", borderBottom: "1px solid rgba(17,17,17,0.12)", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-accent), cursive",
            fontSize: "clamp(1.5rem,3.8vw,3.2rem)",
            color: PINK,
            lineHeight: 1.5,
            maxWidth: 820,
            margin: "0 auto",
            textTransform: "none",
          }}
        >
          &ldquo;{member.quote}&rdquo;
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <div style={{ width: 32, height: 1, background: INK, opacity: 0.2 }} />
          <Label>
            — {member.name} · {member.role}
          </Label>
          <div style={{ width: 32, height: 1, background: INK, opacity: 0.2 }} />
        </div>
      </motion.div>

      <div style={{ padding: "clamp(3rem,7vh,6rem) clamp(1.5rem,5vw,4rem)", borderBottom: "1px solid rgba(17,17,17,0.12)" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "clamp(2rem,4vh,3.5rem)" }}>
          <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.025em", textTransform: "uppercase", color: INK }}>
            QUE HACE
          </div>
          <div
            style={{
              fontFamily: "var(--font-accent), cursive",
              fontSize: "clamp(1.8rem,4.5vw,3.5rem)",
              color: PINK,
              lineHeight: 0.9,
              textTransform: "none",
            }}
          >
            {member.name.toLowerCase()}.
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,240px), 1fr))", gap: 0, border: "1px solid rgba(17,17,17,0.12)" }}>
          {member.expertise.map((item, i) => (
            <motion.div
              key={`${member.id}-${item.label}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.09 }}
              style={{ padding: "clamp(1.5rem,3vw,2.5rem)", borderRight: i < member.expertise.length - 1 ? "1px solid rgba(17,17,17,0.12)" : "none", borderBottom: "1px solid rgba(17,17,17,0.12)" }}
            >
              <div style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.55rem,.75vw,.62rem)", fontWeight: 700, color: PINK, letterSpacing: "0.1em", marginBottom: "0.65rem", opacity: 0.8 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(1.1rem,2vw,1.6rem)", letterSpacing: "0.04em", color: INK, textTransform: "uppercase", marginBottom: "0.75rem" }}>
                {item.label}
              </div>
              <p style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.72rem,1vw,0.86rem)", color: INK, opacity: 0.55, lineHeight: 1.7, margin: 0 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ padding: "clamp(4rem,9vh,8rem) clamp(1.5rem,5vw,4rem)", borderBottom: "1px solid rgba(17,17,17,0.12)", display: "flex", flexDirection: "column", gap: "clamp(1.5rem,3vh,2.5rem)" }}>
        <Label>SIGUIENTE PASO?</Label>
        <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(2.8rem,7.5vw,7rem)", lineHeight: 0.88, letterSpacing: "-0.025em", textTransform: "uppercase", color: INK }}>
          EMPEZA TU<br />
          <span style={{ color: PINK }}>PROYECTO.</span>
        </div>
        <p style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.78rem,1.1vw,.92rem)", color: INK, opacity: 0.5, lineHeight: 1.7, maxWidth: 460, margin: 0 }}>
          Hablanos y armamos el equipo ideal para tu objetivo. Si {member.name} es quien mejor se adapta a lo que necesitas, avanzamos por ahi.
        </p>
        <div className="tm-cta-btns" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="tm-cta-main" onClick={() => router.push("/#contacto")} style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.6rem,.88vw,.75rem)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", background: INK, color: BEIGE, border: `2px solid ${INK}`, padding: "0.85rem 2.2rem", cursor: "pointer", transition: "background .18s, color .18s, border-color .18s" }}>
            CONTACTAR AL EQUIPO ✦
          </button>
          <button className="tm-cta-sec" onClick={() => router.push("/")} style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "clamp(0.6rem,.88vw,.75rem)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: INK, border: "2px solid rgba(17,17,17,0.25)", padding: "0.85rem 2.2rem", cursor: "pointer", transition: "background .18s, color .18s" }}>
            ← VOLVER AL INICIO
          </button>
        </div>
      </motion.div>

      {others.length > 0 && (
        <div style={{ padding: "clamp(3rem,6vh,5rem) clamp(1.5rem,5vw,4rem)", borderBottom: "1px solid rgba(17,17,17,0.12)" }}>
          <div style={{ marginBottom: "clamp(1.5rem,3vh,2.5rem)" }}>
            <Label>TAMBIEN EN EL EQUIPO ✦</Label>
          </div>
          <div className="tm-others-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(others.length, 3)}, 1fr)`, gap: 0, border: "1px solid rgba(17,17,17,0.12)" }}>
            {others.map((other, i) => (
              <motion.button
                key={other.id}
                className="tm-other"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() => router.push(`/team/${other.slug}`)}
                style={{ background: "transparent", border: "none", borderRight: i < others.length - 1 ? "1px solid rgba(17,17,17,0.12)" : "none", padding: "clamp(1.2rem,2.5vw,2rem)", cursor: "pointer", textAlign: "left", opacity: 0.65, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
              >
                <img src={other.image} alt={other.name} style={{ width: "100%", height: "clamp(120px,16vh,200px)", objectFit: "contain", objectPosition: "bottom", display: "block", filter: "grayscale(40%)", transition: "filter .3s" }} />
                <div style={{ width: "100%" }}>
                  <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "clamp(1.4rem,2.8vw,2.2rem)", color: INK, letterSpacing: "0.02em", textAlign: "left" }}>{other.name}</div>
                  <div style={{ marginTop: "0.15rem" }}>
                    <Label>{other.role}</Label>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
