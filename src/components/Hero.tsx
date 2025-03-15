
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 -z-10 overflow-hidden">
          <div className="absolute h-[600px] w-[600px] rounded-full top-[-300px] right-[-200px] bg-gradient-to-b from-blue-100/30 to-blue-200/30 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 overflow-hidden">
          <div className="absolute h-[600px] w-[600px] rounded-full bottom-[-300px] left-[-200px] bg-gradient-to-t from-slate-100/30 to-blue-100/30 blur-3xl"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary mb-4 animate-fade-in">
            IA de Trading Autonome
          </span>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6 animate-slide-down">
            Générez des revenus passifs avec notre IA financière
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 text-balance max-w-2xl animate-slide-up">
            CashBot utilise des algorithmes d'intelligence artificielle avancés pour générer des revenus constants et sécurisés, même pendant votre sommeil.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 w-full sm:w-auto animate-fade-in">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" fullWidth className="group">
                Commencer gratuitement
                <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth>
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 sm:mt-16 p-6 glass-panel rounded-xl animate-scale-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <p className="text-lg font-medium">Nouveau compte Alpha</p>
                <p className="text-4xl font-bold">+€104.28</p>
                <p className="text-sm text-muted-foreground mt-1">Gains aujourd'hui</p>
              </div>
              <div className="h-24 w-[1px] bg-border hidden sm:block"></div>
              <div className="text-left">
                <p className="text-lg font-medium">Transactions réussies</p>
                <p className="text-4xl font-bold">97.6%</p>
                <p className="text-sm text-muted-foreground mt-1">Taux de succès</p>
              </div>
              <div className="h-24 w-[1px] bg-border hidden sm:block"></div>
              <div className="text-left">
                <p className="text-lg font-medium">Utilisateurs actifs</p>
                <p className="text-4xl font-bold">5,280+</p>
                <p className="text-sm text-muted-foreground mt-1">Partout dans le monde</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
