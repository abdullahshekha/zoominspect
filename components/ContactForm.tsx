"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const message = String(form.get("message") || "").trim();
    const honeypot = String(form.get("company") || "");

    if (!name) {
      setError("Full name is required.");
      return;
    }
    if (!email) {
      setError("Email address is required.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp, message, honeypot }),
      });
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
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" />

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
        <label htmlFor="message" className="block text-sm font-medium">Message</label>
        <textarea id="message" name="message" rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
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
