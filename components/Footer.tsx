import { CONTACT_INFO } from "@/lib/siteData";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm">
        <p className="text-lg font-semibold">Zoominspect</p>
        <p className="mt-2 max-w-md text-white/80">
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
