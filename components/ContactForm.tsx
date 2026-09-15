"use client";

import { useState, FormEvent } from "react";
import { SERVICES } from "@/lib/siteData";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — stays under typical serverless request body limits

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const honeypot = String(form.get("company_website") || "");
    const file = form.get("attachment");

    if (!name) {
      setError("Full name is required.");
      return;
    }
    if (!email) {
      setError("Email address is required.");
      return;
    }
    if (file instanceof File && file.size > MAX_FILE_SIZE_BYTES) {
      setError("Attachment must be smaller than 4MB.");
      return;
    }

    // Rename the honeypot field to the name the API route expects, and
    // drop the file field entirely if nothing was chosen (Safari/Firefox
    // still include an empty File entry otherwise).
    form.delete("company_website");
    form.set("honeypot", honeypot);
    if (file instanceof File && file.size === 0) {
      form.delete("attachment");
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return <p className="text-brand-navy">Thanks — we&apos;ve received your message and will respond soon.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field — hidden from real users, bots tend to fill every field */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
          <input id="name" name="name" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
          <input id="email" name="email" type="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium">WhatsApp Number</label>
          <input id="whatsapp" name="whatsapp" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="wechat" className="block text-sm font-medium">WeChat ID</label>
          <input id="wechat" name="wechat" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium">Company Name</label>
          <input id="company" name="companyName" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium">Country</label>
          <input id="country" name="country" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium">Services Interested In</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <label key={service.slug} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="services" value={service.name} className="rounded border-slate-300" />
              {service.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">Additional Notes</label>
        <textarea id="notes" name="notes" rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label htmlFor="attachment" className="block text-sm font-medium">
          File Upload <span className="font-normal text-slate-500">(optional, max 4MB)</span>
        </label>
        <input
          id="attachment"
          name="attachment"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="mt-1 w-full text-sm text-slate-700"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
