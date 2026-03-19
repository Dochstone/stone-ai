import Hero from "@/components/Hero";
import PromoBanner from "@/components/PromoBanner";
import ToolCards from "@/components/ToolCards";
import ProductScreenshot from "@/components/ProductScreenshot";
import DemoShowcase from "@/components/DemoShowcase";
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
      <PromoBanner />
      <ToolCards />
      <ProductScreenshot />
      <DemoShowcase />
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
