
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Button from '@/components/Button';
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
      
      <main className="flex-1">
        <Hero />
        
        {/* Revenue Calculator Section - Moved up and reduced padding */}
        <section className={`${calculatorTopPadding} bg-gradient-to-b from-slate-900 to-slate-950`}>
          <div className="container mx-auto px-3 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className={`text-xl md:text-3xl font-bold mb-3 md:mb-6 text-center text-white ${isMobile ? 'px-2' : ''}`}>
                Simulez vos revenus potentiels avec Stream genius
              </h2>
              <RevenueCalculator 
                currentSubscription="freemium" 
                isNewUser={true}
                isHomePage={true}
              />
            </div>
          </div>
        </section>
        
        {/* How It Works section - New section that replaces testimonials */}
        <HowItWorks />
        
        {/* CTA Section - Reduced padding */}
        <section className="py-6 md:py-14">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-6">Prêt à générer des revenus complémentaires ?</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-8">Rejoignez notre communauté d'utilisateurs et commencez à explorer le potentiel de Stream genius.</p>
              
              <Link to="/register" className="w-full sm:w-auto inline-block">
                <Button 
                  size="lg" 
                  className="group bg-green-500 hover:bg-green-600 text-white font-bold text-lg sm:text-xl py-4 px-6 shadow-xl border border-green-400 w-full sm:w-auto"
                >
                  Démarrer avec Stream genius gratuitement
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
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
