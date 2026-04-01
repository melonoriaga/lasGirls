export type BlogStatus = "draft" | "published" | "archived";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  coverImage?: string;
  gallery?: string[];
  youtubeLinks?: string[];
  tags: string[];
  category: string;
  status: BlogStatus;
  authorId: string;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  likesCount: number;
  featured: boolean;
};

export type BlogLike = {
  id: string;
  postId: string;
  sessionId: string;
  createdAt: string;
};
