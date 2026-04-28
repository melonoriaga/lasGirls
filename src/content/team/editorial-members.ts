export type EditorialTeamMember = {
  id: "jean" | "mel";
  slug: "jean" | "mel";
  name: string;
  fullName: string;
  role: string;
  roleLabel: string;
  tagline: string;
  headline: string;
  image: string;
  blendMultiply: boolean;
  skills: string[];
  bio: string[];
  quote: string;
  expertise: { label: string; desc: string }[];
};

export const editorialMembers: EditorialTeamMember[] = [
  {
    id: "jean",
    slug: "jean",
    name: "JEAN",
    fullName: "JEAN",
    role: "BRANDING & DISENO",
    roleLabel: "Head Of Brand & Direccion Creativa",
    tagline: "marcas que enamoran.",
    headline: "No es\nsolo diseño\nes [[Identidad]]",
    image: "/brand/girls/jean.png",
    blendMultiply: false,
    skills: ["Identidad visual", "Branding", "Diseno para redes"],
    bio: [
      "Hey sexy!, soy Jean, Diseñadora publicitaria y Head of Brand, especializada en tecnología y desarrollo de marcas en Europa/USA/Latam.",
      "Soy la Host y presentadora oficial del MADFA (Madrid Film Awards), festival calificador de IMDb con una categoría con nominación a los premios Óscar que reconoce a creadores audiovisuales de Europa y del resto del mundo.",
      "También formo parte de la organización de eventos internacionales como TED Talks y FuckupNights.",
      "Participo como panelista en el programa de streaming Desayuno con Diseñadores todos los jueves en vivo por YouTube/Twitch/TikTok, un programa auspiciado por la Universidad de Palermo, Trimarchi y Pantone Argentina.",
      "Soy además embajadora/mentora actual y representante en Europa de WEN (Women Entrepreneur Network), comunidad internacional con base en Florida, USA.",
    ],
    quote: "Las marcas son personas, y cada una de ellas tiene una historia que contar.",
    expertise: [
      { label: "BRANDING", desc: "Creo marcas visualmente fuertes y estrategicamente claras, con identidad propia." },
      { label: "COMUNICACION", desc: "Te acompano a ordenar tu mensaje para que se entienda, conecte y convierta mejor." },
      { label: "ESTRATEGIA", desc: "Le doy direccion a cada decision del proyecto para que todo tenga sentido de negocio." },
      { label: "MENTORING", desc: "Acompano procesos para hacer crecer marcas con criterio, foco y resultados sostenibles." },
    ],
  },
  {
    id: "mel",
    slug: "mel",
    name: "MEL",
    fullName: "MEL ONORIAGA",
    role: "CREADORA DE PRODUCTOS",
    roleLabel: "Desarrolladora Fullstack & Creadora de Productos",
    tagline: "código que convierte.",
    headline: "La mente\ndetrás del\ncódigo.",
    image: "/brand/girls/mel.png",
    blendMultiply: false,
    skills: ["React & Node.js", "Landing pages", "Apps web", "UI/UX"],
    bio: [
      "Me especializo en construir productos digitales de punta a punta: desde la arquitectura y el codigo hasta la experiencia final.",
      "Trabajo con enfoque en conversion, claridad y performance: lo que se disena tiene que funcionar en la vida real y sostenerse en el tiempo.",
      "Combino estrategia, desarrollo y criterio de producto para convertir ideas en soluciones concretas, escalables y medibles.",
      "Acompano cada proyecto desde discovery hasta lanzamiento, con una mirada tecnica y de negocio al mismo tiempo.",
    ],
    quote: "El codigo no es el fin. El fin es crear productos que se puedan usar, crecer y vender.",
    expertise: [
      { label: "FRONTEND", desc: "React, Next.js y UI editorial para interfaces rapidas, accesibles y con identidad de marca." },
      { label: "BACKEND", desc: "Node.js, APIs y bases de datos para estructuras solidas, mantenibles y listas para escalar." },
      { label: "PRODUCTO", desc: "Decision tecnica con criterio de negocio: priorizar lo que realmente mueve el proyecto." },
      { label: "UX / UI", desc: "Experiencias claras y funcionales: lo visual acompana conversion, no la reemplaza." },
    ],
  },
];

export const editorialMembersBySlug: Record<string, EditorialTeamMember> = Object.fromEntries(
  editorialMembers.map((member) => [member.slug, member])
);
