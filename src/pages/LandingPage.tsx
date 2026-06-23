import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import LiveDemoSection from '../components/landing/LiveDemoSection';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import RevolutionarySection from '../components/landing/RevolutionarySection';
import AchievementSection from '../components/landing/AchievementSection';
import PricingSection from '../components/landing/PricingSection';
import CommunitySection from '../components/landing/CommunitySection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <LiveDemoSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <RevolutionarySection />
      <AchievementSection />
      <PricingSection />
      <CommunitySection />
      <Footer />
    </>
  );
}
