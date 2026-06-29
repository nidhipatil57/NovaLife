import { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import LiveDemoSection from '../components/landing/LiveDemoSection';
import SolutionSection from '../components/landing/SolutionSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <Navbar />
      <HeroSection onWatchDemoClick={() => setIsDemoOpen(true)} />
      <SolutionSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />

      {isDemoOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDemoOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="demo-modal-close" onClick={() => setIsDemoOpen(false)}>✕</button>
            <LiveDemoSection forceVisible={true} />
          </div>
        </div>
      )}
    </>
  );
}
