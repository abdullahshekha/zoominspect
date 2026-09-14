import Link from "next/link";

export default function ServicePageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{title}</h1>
      <div className="prose prose-slate mt-6 max-w-none prose-h2:text-brand-navy prose-h3:text-brand-navy">
        {children}
      </div>
      <div className="mt-10">
        <Link
          href="/contact"
          className="inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
        >
          Get A Quote
        </Link>
      </div>
    </article>
  );
}
