import type { BlogPost } from "@/types/blog";

export const seedPosts: BlogPost[] = [
  {
    id: "post-01",
    title: "Cuando una idea todavía está verde: cómo arrancar sin perder tiempo",
    slug: "idea-verde-como-arrancar",
    excerpt:
      "Qué mirar primero cuando todavía no está claro si necesitás branding, una landing o un desarrollo más grande.",
    contentMarkdown: `# Empezar con criterio

No todo proyecto necesita empezar igual.

## Lo que sí necesitamos al inicio
- Entender el problema real
- Detectar el objetivo inmediato
- Definir qué validar primero

> Si todavía no sabés qué necesitás, es parte del proceso.

Podés sumar videos:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
`,
    coverImage: "",
    gallery: [],
    youtubeLinks: [],
    tags: ["estrategia", "discovery", "validación"],
    category: "Estrategia",
    status: "published",
    authorId: "system",
    authorName: "Las Girls+",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readingTime: 4,
    seoTitle: "Cómo arrancar un proyecto cuando la idea está verde",
    seoDescription: "Guía práctica para ordenar una idea y definir el primer paso correcto.",
    likesCount: 0,
    featured: true,
  },
];
