import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(8),
  slug: z.string().min(3),
  excerpt: z.string().min(20),
  contentMarkdown: z.string().min(60),
  coverImage: z.string().url().optional().or(z.literal("")),
  youtubeLinks: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).default([]),
  category: z.string().min(2),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
