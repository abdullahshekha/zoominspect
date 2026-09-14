import Link from "next/link";
import { Service } from "@/lib/siteData";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="rounded-lg border border-slate-100 p-6 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg">{service.name}</h3>
      <p className="mt-1 text-sm font-semibold text-brand-orange">{service.priceLabel}</p>
      <p className="mt-3 text-sm text-slate-600">{service.description}</p>
      <Link
        href={`/${service.slug}`}
        className="mt-4 inline-block text-sm font-semibold text-brand-navy hover:underline"
      >
        Learn More &rarr;
      </Link>
    </div>
  );
}
