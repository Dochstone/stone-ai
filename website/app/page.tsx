import Hero from "@/components/Hero";
import ToolCards from "@/components/ToolCards";
import HowItWorks from "@/components/HowItWorks";
import ModelGrid from "@/components/ModelGrid";

import FeaturesTable from "@/components/FeaturesTable";
import Pricing from "@/components/Pricing";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ToolCards />
      <HowItWorks />
      <ModelGrid />
      <FeaturesTable />
      <Pricing />
      <Reviews />
      <FAQ />
      <CtaSection />
    </>
  );
}
