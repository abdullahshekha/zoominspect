import Link from "next/link";
import Image from "next/image";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/lib/siteData";

const WHY_US_BADGES = [
  { src: "/images/site/badge-money-back.png", alt: "100% Money-Back Guarantee", width: 1201, height: 235 },
  { src: "/images/site/badge-hq-china.png", alt: "Headquarters in China", width: 1201, height: 234 },
  { src: "/images/site/badge-competitive-charges.png", alt: "Competitive Charges", width: 1024, height: 200 },
  { src: "/images/site/badge-quality-experts.png", alt: "Quality Experts", width: 1024, height: 200 },
];

function whatsappHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
}

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
    <article className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-3xl">{title}</h1>
          <div className="prose prose-slate mt-6 max-w-none prose-h2:text-brand-navy prose-h3:text-brand-navy">
            {children}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg bg-brand-navy p-6 text-white">
            <h2 className="text-lg text-white">Book Our Service</h2>
            <p className="mt-2 text-sm text-white/80">
              Ready to get started? Get a free, no-obligation quote today.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-md bg-brand-gold px-5 py-2.5 font-semibold text-brand-navy"
            >
              Get A Quote
            </Link>
          </div>

          <div className="rounded-lg border border-slate-100 p-6">
            <h2 className="text-lg">Contact Us</h2>
            <div className="mt-4 space-y-4 text-sm">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-3 text-slate-700 hover:text-brand-navy"
              >
                <Image src="/images/site/icon-email.png" alt="" width={300} height={300} className="h-8 w-8" />
                {CONTACT_INFO.email}
              </a>
              <a
                href={whatsappHref(CONTACT_INFO.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-700 hover:text-brand-navy"
              >
                <Image src="/images/site/icon-whatsapp.png" alt="" width={300} height={300} className="h-8 w-8" />
                {CONTACT_INFO.whatsapp}
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 p-6">
            <h2 className="text-lg">Follow Us</h2>
            <div className="mt-4 flex gap-4 text-sm">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-navy hover:underline"
              >
                Facebook
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-navy hover:underline"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 p-6">
            <h2 className="text-lg">Why Choose Us</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              {WHY_US_BADGES.map((badge) => (
                <Image
                  key={badge.src}
                  src={badge.src}
                  alt={badge.alt}
                  width={badge.width}
                  height={badge.height}
                  className="h-16 w-auto"
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-12 overflow-hidden rounded-lg bg-brand-navy">
        <div className="relative h-56 w-full">
          <Image
            src={bannerImage}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
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
