import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Samples Inspection | Zoominspect" };

export default function SamplesInspectionPage() {
  return (
    <ServicePageLayout title="Samples Inspection">
      <p>
        A sample checking service involves inspecting a relatively small
        number of items from a batch or lot for a range of specifications —
        appearance, workmanship, safety, functions, and more — prior to
        mass production.
      </p>
      <p>
        It is an essential step before manufacturing begins, starting with
        a physical inspection of a product sample to spot defects before
        mass production. During sample checking, the physical and
        functional characteristics of the product are verified against
        engineering drawings, a purchase order, specifications, and other
        design documents, ensuring the sample meets specified requirements
        and avoiding bulk quality problems during manufacturing.
      </p>

      <h2>Zoominspect Sample Checking Service Mainly Includes</h2>
      <ul>
        <li>
          <strong>Quantity check</strong> — check the quantity of finished
          goods to be manufactured.
        </li>
        <li>
          <strong>Workmanship check</strong> — check the degree of skill and
          the quality of materials and finished product based on a design.
        </li>
        <li>
          <strong>Style, color &amp; documentation</strong> — check whether
          the product style and color are consistent with specifications
          and other design documents.
        </li>
        <li>
          <strong>Field test &amp; measurement</strong> — test the product
          in an actual situation reflecting its intended use, and survey
          existing conditions against drawings at the field site.
        </li>
        <li>
          <strong>Shipping mark &amp; packaging</strong> — check whether the
          shipping mark and packaging comply with relevant requirements.
        </li>
      </ul>

      <h2>Advantages of Samples Inspection</h2>
      <ul>
        <li>Involves less inspection to achieve a pre-decided degree of certainty about quality.</li>
        <li>Consumes less time and is less expensive.</li>
        <li>Less fatigue and boredom for inspectors, keeping operating efficiency high.</li>
        <li>More accurate — 100% inspection introduces errors from fatigue and repetitive work.</li>
        <li>Since fewer pieces are inspected, no damage is done to the rest of the lot.</li>
        <li>Necessary where components require destructive testing or chemical analysis, where 100% inspection can never be employed.</li>
        <li>Rejection of a complete batch based on a sample pressures suppliers to improve quality.</li>
      </ul>
    </ServicePageLayout>
  );
}
