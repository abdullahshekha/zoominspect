import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Our Blogs | Zoominspect" };

export default function BlogsPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl">Read Our Blogs</h1>
      <p className="mt-2 text-slate-600">
        Insights on quality control, inspections, and sourcing from China.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-slate-500">No posts published yet.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="block overflow-hidden rounded-lg border border-slate-100 shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-40 w-full bg-slate-100">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h2 className="text-base">{post.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
