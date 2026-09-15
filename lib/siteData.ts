export type Service = {
  slug: string;
  name: string;
  priceLabel: string;
  description: string;
  image: string;
};

export type IndustryGroup = {
  name: string;
  items: string[];
};

export const CONTACT_INFO = {
  email: "info@zoominspect.com",
  whatsapp: "+86 156 6700 2048",
};

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/zoominspect",
  linkedin: "https://www.linkedin.com/company/zoominspect/",
};

export const SERVICES: Service[] = [
  {
    slug: "pre-shipment-inspection",
    name: "Pre-Shipment Inspection",
    priceLabel: "Starting from $249",
    description:
      "Carried out when your supplier has completed the order. We check that the product has been manufactured according to the highest standards before it is shipped.",
    image: "/images/site/services/pre-shipment-inspection.jpg",
  },
  {
    slug: "during-production-inspection",
    name: "During Production",
    priceLabel: "Starting from $249",
    description:
      "Perfect for making sure that your product is being manufactured according to the best possible standards and with the correct craftsmanship, material and machinery.",
    image: "/images/site/services/during-production-inspection.jpg",
  },
  {
    slug: "factory-supplier-audit",
    name: "Factory Audit",
    priceLabel: "Starting from $350",
    description:
      "The best way to vet a supplier for their competency. We check if they have the proper skill, machinery, labor material and licenses to manufacture your product.",
    image: "/images/site/services/factory-supplier-audit.jpg",
  },
  {
    slug: "samples-inspection",
    name: "Samples Inspection",
    priceLabel: "Starting from $195",
    description:
      "If you are planning to outsource products from China for FBA, you are surely considering samples from different suppliers. We inspect each one for you to be confident in the supplier you choose.",
    image: "/images/site/services/samples-inspection.jpg",
  },
  {
    slug: "product-sourcing",
    name: "Product Sourcing",
    priceLabel: "Starting from $670",
    description:
      "Still choosing a reliable supplier in China with competent rates and best quality for your product? We hunt for your best match to handle your product supply according to your terms.",
    image: "/images/site/services/product-sourcing.jpg",
  },
  {
    slug: "freight-forwarding",
    name: "Freight Forwarding",
    priceLabel: "By Sea, Air or Land",
    description:
      "Have your inventory ready in China and planning to have it shipped to your desired country? We handle freight forwarding to any country in the world by sea, land or air.",
    image: "/images/site/services/freight-forwarding.jpg",
  },
  {
    slug: "patent-trademark-china",
    name: "Patent & Trademark in China",
    priceLabel: "Cost Varies",
    description:
      "Have a unique idea you want manufactured in China but worry it could be stolen? We take care of patent and trademark registration for you.",
    image: "/images/site/services/patent-trademark-china.jpg",
  },
  {
    slug: "product-consolidation",
    name: "Product Consolidation",
    priceLabel: "Starting from $50",
    description:
      "Doing market research before investing a huge chunk? We consolidate samples from a lot of suppliers into a single package and ship it right to your doorstep.",
    image: "/images/site/services/product-consolidation.jpg",
  },
  {
    slug: "product-photography",
    name: "Product Photography",
    priceLabel: "Starting from $300",
    description:
      "Waiting for your first sample to arrive just to start your creative journey can be frustrating. Let our expert photographers in China take care of that.",
    image: "/images/site/services/product-photography.jpg",
  },
];

export const INDUSTRIES: IndustryGroup[] = [
  { name: "Softlines", items: ["Textile & Garments", "Footwear", "Fashion Accessories", "Soft Toys"] },
  { name: "Hardlines", items: ["Furniture", "Electrical", "Bikes & Sporting Goods", "Hardware"] },
  { name: "Transportation", items: ["Automotive", "Motorcycle", "E-Mobility", "Parts & Components"] },
  { name: "Industrial", items: ["Machinery", "Oil & Gas", "Power Equipment", "Metals"] },
  { name: "Healthcare", items: ["Medical Devices", "Medical Equipment", "Protective Equipment", "Cosmetics"] },
  { name: "Electronics", items: ["Motors", "Circuits", "Cell Phone/Watches", "Computer Accessories"] },
];

export const NAV_LINKS = [
  { label: "About Us", href: "/#about-us" },
  {
    label: "Our Solutions",
    href: "/#our-solutions",
    dropdown: SERVICES.map((s) => ({ label: s.name, href: `/${s.slug}` })),
  },
  { label: "Your Industry", href: "/#your-industry" },
  {
    label: "Resources",
    href: "/blogs",
    dropdown: [
      { label: "Our Blogs", href: "/blogs" },
      { label: "Inspection Standards", href: "/inspection-standards" },
    ],
  },
  { label: "Contact Us", href: "/contact" },
];
