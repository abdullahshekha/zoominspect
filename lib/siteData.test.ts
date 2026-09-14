import { describe, it, expect } from "vitest";
import { SERVICES, INDUSTRIES, CONTACT_INFO, NAV_LINKS } from "./siteData";

describe("siteData", () => {
  it("has exactly the 9 services from the old site's service grid", () => {
    expect(SERVICES).toHaveLength(9);
    const slugs = SERVICES.map((s) => s.slug);
    expect(slugs).toEqual([
      "pre-shipment-inspection",
      "during-production-inspection",
      "factory-supplier-audit",
      "samples-inspection",
      "product-sourcing",
      "freight-forwarding",
      "patent-trademark-china",
      "product-consolidation",
      "product-photography",
    ]);
  });

  it("has 6 industry groups matching the old site", () => {
    expect(INDUSTRIES.map((i) => i.name)).toEqual([
      "Softlines",
      "Hardlines",
      "Transportation",
      "Industrial",
      "Healthcare",
      "Electronics",
    ]);
  });

  it("has correct contact info", () => {
    expect(CONTACT_INFO.email).toBe("info@zoominspect.com");
    expect(CONTACT_INFO.whatsapp).toBe("+86 156 6700 2048");
  });

  it("includes a Contact Us nav link", () => {
    expect(NAV_LINKS.some((l) => l.href === "/contact")).toBe(true);
  });
});
