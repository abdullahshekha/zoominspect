import Link from "next/link";
import Image from "next/image";

export default function ServicePageLayout({
  title,
  bannerImage = "/images/site/service-banner-default.jpg",
  children,
}: {
  title: string;
  bannerImage?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{title}</h1>
      <div className="prose prose-slate mt-6 max-w-none prose-h2:text-brand-navy prose-h3:text-brand-navy">
        {children}
      </div>

      <div className="mt-12 overflow-hidden rounded-lg bg-brand-navy">
        <div className="relative h-56 w-full">
          <Image
            src={bannerImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover opacity-70"
          />
        </div>
        <div className="p-6 text-center">
          <h2 className="text-xl text-white">Ready to make us your partners in China?</h2>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
          >
            Get A Quote
          </Link>
        </div>
      </div>
    </article>
  );
}
