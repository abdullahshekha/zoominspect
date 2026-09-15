"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { NAV_LINKS } from "@/lib/siteData";

// How long to wait before closing a dropdown after the mouse leaves it, so
// moving diagonally from the trigger into the panel doesn't close it early.
const DROPDOWN_CLOSE_DELAY_MS = 250;

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow(label: string) {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenDropdown(label);
  }

  function closeSoon() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), DROPDOWN_CLOSE_DELAY_MS);
  }

  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="Zoominspect — No. 1 Inspection Company in China"
            width={2917}
            height={1381}
            priority
            className="h-24 w-auto"
          />
        </Link>

        <nav data-testid="desktop-nav" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.dropdown && openNow(link.label)}
              onMouseLeave={() => link.dropdown && closeSoon()}
            >
              {link.dropdown ? (
                <button
                  className="text-sm font-medium text-slate-700 hover:text-brand-navy"
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === link.label}
                  onClick={() =>
                    setOpenDropdown(openDropdown === link.label ? null : link.label)
                  }
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  href={link.href}
                  className="text-sm font-medium text-slate-700 hover:text-brand-navy"
                >
                  {link.label}
                </Link>
              )}

              {link.dropdown && openDropdown === link.label && (
                <div className="absolute left-0 top-full z-10 w-64 pt-3">
                  <div className="rounded-md border border-slate-100 bg-white p-2 shadow-lg">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link
            href="/contact"
            className="rounded-md bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-navy hover:opacity-90"
          >
            Get A Quote
          </Link>
        </nav>

        <button
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      <nav
        data-testid="mobile-nav"
        className={`${mobileOpen ? "block" : "hidden"} border-t border-slate-100 px-4 py-2 md:hidden`}
      >
        {NAV_LINKS.flatMap((link) =>
          link.dropdown
            ? [{ label: link.label, href: link.href }, ...link.dropdown]
            : [{ label: link.label, href: link.href }]
        ).map((item) => (
          <Link key={item.href} href={item.href} className="block py-2 text-sm text-slate-700">
            {item.label}
          </Link>
        ))}
        <Link
          href="/contact"
          className="mt-2 block rounded-md bg-brand-gold px-4 py-2 text-center text-sm font-semibold text-brand-navy"
        >
          Get A Quote
        </Link>
      </nav>
    </header>
  );
}
