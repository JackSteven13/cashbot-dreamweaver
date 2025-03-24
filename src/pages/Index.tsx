
import { ArrowRight, BarChart3, Cpu, Lock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { FeaturesGrid } from '@/components/Feature';
import Button from '@/components/Button';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import Footer from '@/components/Footer';

const Index = () => {
  const features = [
    {
      title: 'Technologies d\'Analyse',
      description: 'Notre moteur d\'analyse traite les publicités en ligne pour optimiser leur visibilité et leur rentabilité.',
      icon: <Cpu className="w-6 h-6" />
    },
    {
      title: 'Processus Automatisé',
      description: 'Générez des revenus complémentaires grâce à notre système d\'analyse entièrement automatisé.',
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
      description: 'Nos algorithmes s\'améliorent constamment pour maintenir des performances optimales.',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: 'Confidentialité Garantie',
      description: 'Nous respectons scrupuleusement la réglementation RGPD pour protéger vos informations.',
      icon: <Lock className="w-6 h-6" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        
        {/* Revenue Calculator Section - Moved up and reduced padding */}
        <section className="py-6 md:py-10 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white">
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
        
        {/* Features section - Smaller padding to make page more compact */}
        <FeaturesGrid 
          title="Une Plateforme d'Analyse Publicitaire Innovante"
          subtitle="Stream genius utilise des technologies d'analyse avancées pour optimiser les campagnes publicitaires et générer des revenus complémentaires."
          features={features}
        />
        
        {/* Testimonials Section - Témoignages améliorés et plus cohérents avec le simulateur */}
        <section className="py-8 md:py-14 bg-gradient-subtle">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Témoignages d'utilisateurs</h2>
              <p className="text-base md:text-lg text-muted-foreground">Découvrez ce que nos utilisateurs disent de Stream genius.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">JL</div>
                  <div>
                    <p className="font-medium">Jean L.</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Paris, utilisateur depuis 6 mois</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"Avec l'abonnement Pro, je génère environ 1200€ mensuels. La différence avec Freemium est spectaculaire, et la plateforme est très facile à utiliser."</p>
              </div>
              
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">CM</div>
                  <div>
                    <p className="font-medium">Caroline M.</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Lyon, utilisatrice depuis 4 mois</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"Après 2 mois avec l'abonnement Visionnaire, je génère 1500€ mensuels. Les outils d'analyse avancés permettent de maximiser les performances quotidiennement."</p>
              </div>
              
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">PD</div>
                  <div>
                    <p className="font-medium">Philippe D.</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Marseille, utilisateur depuis 3 mois</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"J'ai commencé avec Pro puis je suis passé à Alpha. Je génère maintenant plus de 2200€ par mois avec très peu d'effort. L'investissement en vaut vraiment la peine."</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section - Reduced padding */}
        <section className="py-8 md:py-14">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Prêt à générer des revenus complémentaires ?</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">Rejoignez notre communauté d'utilisateurs et commencez à explorer le potentiel de Stream genius.</p>
              
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
