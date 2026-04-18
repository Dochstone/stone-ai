import Hero from "@/components/Hero";
import PopularTasks from "@/components/PopularTasks";
import PromoBanner from "@/components/PromoBanner";
import ToolCards from "@/components/ToolCards";
import ToolsGallery from "@/components/ToolsGallery";
import ProductScreenshot from "@/components/ProductScreenshot";
import DemoShowcase from "@/components/DemoShowcase";
import HowItWorks from "@/components/HowItWorks";
import ModelGrid from "@/components/ModelGrid";

// FeaturesTable removed — pricing section covers this
import Pricing from "@/components/Pricing";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import CtaSection from "@/components/CtaSection";
import ModelViewerScript from "@/components/ModelViewerScript";
import { homeFaqData } from "@/lib/faq-data";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqData.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ModelViewerScript />
      <Hero />
      <PopularTasks />
      <PromoBanner />
      <ToolCards />
      <ToolsGallery />
      <ProductScreenshot />
      <DemoShowcase />
      <HowItWorks />
      <ModelGrid />
      <Pricing />
      <Reviews />
      <FAQ />
      <CtaSection />
    </>
  );
}
