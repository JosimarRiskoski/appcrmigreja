import { Navbar } from "../components/landing/Navbar";
import "../index.css";
import { HeroSection } from "../components/landing/HeroSection";
import { ProblemSection } from "../components/landing/ProblemSection";
import { SolutionSection } from "../components/landing/SolutionSection";
import { WhatIsSection } from "../components/landing/WhatIsSection";
import { BenefitsSection } from "../components/landing/BenefitsSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { DifferentialsSection } from "../components/landing/DifferentialsSection";
import { PlansSection } from "../components/landing/PlansSection";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/landing/Footer";

const Index = () => {
  return (
    <main className="vendas-theme min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <WhatIsSection />
      <BenefitsSection />
      <HowItWorksSection />
      <DifferentialsSection />
      <PlansSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
