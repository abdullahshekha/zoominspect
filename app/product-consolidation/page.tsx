import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Product Consolidation | Zoominspect" };

export default function ProductConsolidationPage() {
  return (
    <ServicePageLayout title="Product Consolidation">
      <p>
        If you&apos;re sourcing samples from multiple suppliers across China
        before committing to a bulk order, shipping each one separately
        quickly becomes expensive and hard to track. Zoominspect&apos;s
        product consolidation service collects samples or goods from
        several suppliers into a single warehouse, then combines them into
        one package for shipment to your doorstep.
      </p>

      <h2>How It Works</h2>
      <ul>
        <li>We receive your samples or goods from multiple suppliers at our facility in China.</li>
        <li>Each shipment is checked in, logged, and inspected on arrival for damage or shortages.</li>
        <li>Items are consolidated into a single, properly packed shipment.</li>
        <li>We arrange freight forwarding for the consolidated package to your destination of choice.</li>
      </ul>

      <h2>Why Consolidate</h2>
      <ul>
        <li>Lower shipping costs compared to paying for separate international shipments per supplier.</li>
        <li>One tracking number and one delivery instead of managing several.</li>
        <li>An opportunity to inspect and compare samples side by side before deciding on a supplier.</li>
        <li>Reduced risk of items being lost or delayed in transit from multiple sources.</li>
      </ul>
      <p>
        Product consolidation pairs naturally with our sample inspection and
        freight forwarding services — talk to us about combining them into
        one streamlined process while you evaluate suppliers.
      </p>
    </ServicePageLayout>
  );
}
