import Image from "next/image";
import { CONTACT_INFO } from "@/lib/siteData";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm">
        <Image
          src="/images/logo-white.png"
          alt="Zoominspect"
          width={2917}
          height={1381}
          className="h-12 w-auto"
        />
        <p className="mt-4 max-w-md text-white/80">
          No. 1 inspection company in China — quality control, factory audits,
          product sourcing and freight forwarding.
        </p>
        <div className="mt-6 space-y-1">
          <p>Email us: <span>{CONTACT_INFO.email}</span></p>
          <p>WhatsApp us: <span>{CONTACT_INFO.whatsapp}</span></p>
        </div>
        <p className="mt-8 text-white/60">
          &copy; {new Date().getFullYear()} Zoominspect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
