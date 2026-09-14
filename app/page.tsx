import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import IndustryGroup from "@/components/IndustryGroup";
import { SERVICES, INDUSTRIES } from "@/lib/siteData";

export default function HomePage() {
  return (
    <>
      <section className="bg-brand-navy py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            No. 1 Inspection Company In China
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Zoominspect is a leading inspections company in China. We provide
            tailored product inspections, factory audits, freight forwarding
            and many other solutions with 100% client satisfaction guaranteed.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
          >
            Get a Quote
          </Link>
        </div>
      </section>

      <section id="about-us" className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Vision For The Future
        </p>
        <h2 className="mt-2 text-center text-3xl">Our Philosophy</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          We are your one-stop Quality Partner, ready to deliver an efficient
          and ever-evolving service that encompasses every aspect of your
          supply chain. Zoominspect is a leading inspection company in China —
          we are proud to serve thousands of clients across the world through
          timely commitments and thorough inspections.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl italic">Our Mission</h3>
            <p className="mt-2 text-slate-600">
              Offer Quality Assurance service to our clients — our product
              experts help you review your product at any production phase
              and provide a custom solution to any production challenge you
              might face.
            </p>
          </div>
          <div>
            <h3 className="text-xl italic">Our Vision</h3>
            <p className="mt-2 text-slate-600">
              To offer our global network of quality technical experts
              together with our digital supply chain solutions, delivering a
              transparent, real-time, total supply chain management
              experience at minimum cost.
            </p>
          </div>
        </div>
      </section>

      <section id="our-solutions" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">Select Your Required Service</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            We have market-competent pricing with premium services to ensure
            you get the best value for your money.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section id="your-industry" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Industries
        </p>
        <h2 className="mt-2 text-center text-3xl">
          Quality Assurance &amp; Quality Control Services by Industry
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((group) => (
            <IndustryGroup key={group.name} group={group} />
          ))}
        </div>
      </section>

      <section className="bg-brand-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Leading Inspection Company In China
          </p>
          <p className="mt-4 text-lg text-white/80">
            Zoom Inspect goes beyond the traditional roles of quality
            control. For nearly two decades, we have been providing
            comprehensive quality control solutions and consulting services
            tailored to our clients&apos; needs.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
          >
            Get a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
