
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import HowItWorks from '@/components/HowItWorks';

const Index = () => {
  const isMobile = useIsMobile();

  // Ajuster les espacements pour mobile
  const sectionPadding = isMobile ? "py-4 md:py-10" : "py-6 md:py-10";
  const calculatorTopPadding = isMobile ? "pt-2 pb-4" : "py-6 md:py-10";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Added content-padding-top class to Hero for spacing */}
      <main className="flex-1 content-padding-top">
        <Hero />
        
        {/* Revenue Calculator Section - Moved up and reduced padding */}
        <section className={`${calculatorTopPadding} bg-gradient-to-b from-slate-900 to-slate-950`}>
          <div className="container mx-auto px-3 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className={`text-xl md:text-3xl font-bold mb-3 md:mb-6 text-center text-white ${isMobile ? 'px-2' : ''}`}>
                Simulez vos revenus potentiels avec nos agents IA Stream Genius
              </h2>
              <RevenueCalculator 
                currentSubscription="freemium" 
                isNewUser={true}
                isHomePage={true}
              />
            </div>
          </div>
        </section>
        
        {/* How It Works section */}
        <HowItWorks />
        
        {/* CTA Section - Reduced padding */}
        <section className="py-6 md:py-14">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-6">Prêt à déployer nos agents IA pour générer des revenus automatiques ?</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-8">
                Rejoignez notre communauté d'utilisateurs et laissez nos agents d'intelligence artificielle travailler pour vous 24h/24.
              </p>
              
              <Link to="/register" className="inline-block">
                <button className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-md flex items-center justify-center transition-colors">
                  <span className="text-lg">Démarrer maintenant</span>
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
