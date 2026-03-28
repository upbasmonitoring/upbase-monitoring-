import { Suspense, lazy } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";

const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const IntegrationsSection = lazy(() => import("@/components/landing/IntegrationsSection"));
const FooterSection = lazy(() => import("@/components/landing/FooterSection"));
const UniqueFeatures = lazy(() => import("@/components/landing/UniqueFeatures"));
const GlobalNetwork = lazy(() => import("@/components/landing/GlobalNetwork"));

const SectionLoader = () => (
  <div className="py-24 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
        <UniqueFeatures />
        <IntegrationsSection />
        <FooterSection />
      </Suspense>
    </div>
  );
};

export default LandingPage;
