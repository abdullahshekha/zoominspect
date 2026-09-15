import Link from "next/link";
import Image from "next/image";
import { Service } from "@/lib/siteData";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 shadow-sm transition hover:shadow-md">
      <div className="relative h-40 w-full">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-6">
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
    </div>
  );
}
