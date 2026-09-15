import Image from "next/image";

const BADGES = [
  { src: "/images/site/badge-money-back.png", alt: "100% Money-Back Guarantee", width: 1201, height: 235 },
  { src: "/images/site/badge-hq-china.png", alt: "Headquarters in China", width: 1201, height: 234 },
  { src: "/images/site/badge-competitive-charges.png", alt: "Competitive Charges", width: 1024, height: 200 },
  { src: "/images/site/badge-quality-experts.png", alt: "Quality Experts", width: 1024, height: 200 },
];

export default function TrustBadges() {
  return (
    <div className="border-y border-slate-100 bg-slate-50 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {BADGES.map((badge) => (
          <div key={badge.src} className="flex items-center justify-center">
            <Image
              src={badge.src}
              alt={badge.alt}
              width={badge.width}
              height={badge.height}
              className="h-10 w-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
