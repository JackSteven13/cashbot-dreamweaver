
import { ArrowRight, BarChart3, Cpu, Lock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { FeaturesGrid } from '@/components/Feature';
import Button from '@/components/Button';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import HowItWorks from '@/components/HowItWorks';

const Index = () => {
  const isMobile = useIsMobile();
  
  const features = [
    {
      title: 'Technologies d\'Analyse',
      description: 'Notre bot d\'analyse traite les vidéos publicitaires en ligne pour générer des revenus grâce à leur visionnage automatique.',
      icon: <Cpu className="w-6 h-6" />
    },
    {
      title: 'Processus Automatisé',
      description: 'Générez des revenus complémentaires grâce à notre bot qui visionne automatiquement des vidéos publicitaires sponsorisées.',
      icon: <Zap className="w-6 h-6" />
    },
    {
      title: 'Sécurité Avancée',
      description: 'Vos données sont protégées par des protocoles de chiffrement et de sécurité robustes.',
      icon: <ShieldCheck className="w-6 h-6" />
    },
    {
      title: 'Statistiques Détaillées',
      description: 'Suivez vos performances avec des rapports détaillés mis à jour en temps réel.',
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      title: 'Optimisation Continue',
      description: 'Notre bot s\'améliore constamment pour maintenir des performances optimales de visionnage.',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: 'Confidentialité Garantie',
      description: 'Nous respectons scrupuleusement la réglementation RGPD pour protéger vos informations.',
      icon: <Lock className="w-6 h-6" />
    }
  ];

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
        
        {/* Features section - Smaller padding to make page more compact */}
        <FeaturesGrid 
          title="Une Plateforme de Visionnage Automatique Innovante"
          subtitle="Stream genius utilise un bot avancé pour visionner des vidéos publicitaires sponsorisées et générer des revenus complémentaires pour vous."
          features={features}
        />
        
        {/* CTA Section - Reduced padding */}
        <section className="py-6 md:py-14">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-6">Prêt à générer des revenus complémentaires ?</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-8">Rejoignez notre communauté d'utilisateurs et commencez à explorer le potentiel de Stream genius.</p>
              
              <Link to="/register">
                <Button size="lg" className="group">
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
