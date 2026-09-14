import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return { title: post ? `${post.title} | Zoominspect` : "Post Not Found | Zoominspect" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{post.date}</p>
      <div className="relative mt-6 h-64 w-full overflow-hidden rounded-lg bg-slate-100">
        <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
      </div>
      <div className="prose prose-slate mt-8 max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
