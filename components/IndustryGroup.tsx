import Image from "next/image";
import { IndustryGroup as IndustryGroupType } from "@/lib/siteData";

export default function IndustryGroup({ group }: { group: IndustryGroupType }) {
  return (
    <div className="rounded-lg bg-slate-50 p-6">
      <Image src={group.icon} alt="" width={401} height={401} className="h-12 w-12" />
      <h3 className="mt-3 text-base">{group.name}</h3>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
