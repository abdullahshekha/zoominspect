import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export function getAllPostsFrom(dir: string): BlogPost[] {
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      excerpt: data.excerpt as string,
      coverImage: data.coverImage as string,
      content,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlugFrom(dir: string, slug: string): BlogPost | undefined {
  return getAllPostsFrom(dir).find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return getAllPostsFrom(BLOG_DIR);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPostBySlugFrom(BLOG_DIR, slug);
}
