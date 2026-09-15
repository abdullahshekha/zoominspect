import Image from "next/image";
import Link from "next/link";
import { CONTACT_INFO, SERVICES, SOCIAL_LINKS } from "@/lib/siteData";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/images/logo-white.png"
              alt="Zoominspect"
              width={2917}
              height={1381}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-xs text-white/80">
              No. 1 inspection company in China — quality control, factory
              audits, product sourcing and freight forwarding.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                Facebook
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold uppercase tracking-wide text-brand-gold">
              Our Solutions
            </h3>
            <ul className="mt-4 space-y-2">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/${service.slug}`} className="text-white/80 hover:text-white">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold uppercase tracking-wide text-brand-gold">
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/#about-us" className="text-white/80 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#your-industry" className="text-white/80 hover:text-white">
                  Your Industry
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-white/80 hover:text-white">
                  Our Blogs
                </Link>
              </li>
              <li>
                <Link href="/inspection-standards" className="text-white/80 hover:text-white">
                  Inspection Standards
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 hover:text-white">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold uppercase tracking-wide text-brand-gold">
              Contact Us
            </h3>
            <div className="mt-4 space-y-3">
              <p>
                Email us:
                <br />
                <span>{CONTACT_INFO.email}</span>
              </p>
              <p>
                WhatsApp us:
                <br />
                <span>{CONTACT_INFO.whatsapp}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-6 text-white/60">
          &copy; {new Date().getFullYear()} Zoominspect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
