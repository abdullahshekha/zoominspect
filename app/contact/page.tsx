import ContactForm from "@/components/ContactForm";
import { CONTACT_INFO } from "@/lib/siteData";

export const metadata = { title: "Contact Us | Zoominspect" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">Get a Quote or Book a Service</h1>
      <p className="mt-2 text-slate-600">
        Want to know more about our solutions? Fill in the form below and
        we&apos;ll respond as soon as possible.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
        <p>Email us: {CONTACT_INFO.email}</p>
        <p>WhatsApp us: {CONTACT_INFO.whatsapp}</p>
      </div>
    </div>
  );
}
