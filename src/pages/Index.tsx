
import { ArrowRight, BarChart3, Cpu, Lock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { FeaturesGrid } from '@/components/Feature';
import Button from '@/components/Button';

const Index = () => {
  const features = [
    {
      title: 'Intelligence Artificielle',
      description: 'Notre moteur d\'IA analyse des millions de publicités pour identifier les plus rémunératrices.',
      icon: <Cpu className="w-6 h-6" />
    },
    {
      title: 'Analyse Automatisée',
      description: 'Générez des revenus constants sans connaissances techniques et sans effort manuel.',
      icon: <Zap className="w-6 h-6" />
    },
    {
      title: 'Sécurité Maximale',
      description: 'Vos données sont toujours protégées grâce à nos protocoles de sécurité de pointe.',
      icon: <ShieldCheck className="w-6 h-6" />
    },
    {
      title: 'Analyses en Temps Réel',
      description: 'Obtenez des rapports détaillés sur chaque campagne publicitaire analysée.',
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      title: 'Rendements Supérieurs',
      description: 'Nos algorithmes surpassent constamment les méthodes traditionnelles de monétisation.',
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: 'Confidentialité Garantie',
      description: 'Vos données personnelles sont cryptées et jamais partagées.',
      icon: <Lock className="w-6 h-6" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        
        <FeaturesGrid 
          title="Une Plateforme de Monétisation Révolutionnaire"
          subtitle="CashBot combine intelligence artificielle et analyse de publicités pour créer un système de revenus passifs unique."
          features={features}
        />
        
        {/* Testimonials Section */}
        <section className="py-12 md:py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Ce que nos utilisateurs disent</h2>
              <p className="text-base md:text-lg text-muted-foreground">Des milliers d'utilisateurs font confiance à CashBot pour générer des revenus passifs.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">MB</div>
                  <div>
                    <p className="font-medium">Marc Bertrand</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Utilisateur depuis 3 mois</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"CashBot a complètement changé ma vision des revenus passifs. Je génère maintenant plus en une semaine qu'avec mes placements bancaires en un an."</p>
              </div>
              
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">SL</div>
                  <div>
                    <p className="font-medium">Sophie Laurent</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Utilisatrice depuis 1 an</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"Je n'ai aucune connaissance technique, mais grâce à CashBot, j'ai pu créer un flux de revenus passifs stable qui a transformé ma vie financière."</p>
              </div>
              
              <div className="glass-card p-4 md:p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">TM</div>
                  <div>
                    <p className="font-medium">Thomas Martin</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Utilisateur depuis 6 mois</p>
                  </div>
                </div>
                <p className="italic text-sm md:text-base text-muted-foreground">"Les rapports détaillés et la transparence de CashBot m'ont convaincu. Je peux suivre chaque centime généré et comprendre les annonces analysées."</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Prêt à transformer votre avenir financier ?</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">Rejoignez plus de 5000 utilisateurs qui génèrent déjà des revenus passifs avec CashBot.</p>
              
              <Link to="/register">
                <Button size="lg" className="group">
                  Démarrer avec CashBot gratuitement
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg font-semibold">CashBot</p>
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Tous droits réservés</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
