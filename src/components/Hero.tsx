
import { useIsMobile } from '../hooks/use-mobile';
import LocationFeed from './LocationFeed';
import BackgroundElements from './hero/BackgroundElements';
import HeroCallToAction from './hero/HeroCallToAction';
import StatsCounter from './hero/StatsCounter';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative overflow-hidden pt-12 pb-6 md:pt-24 md:pb-10">
      {/* Background Elements */}
      <BackgroundElements />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-4 md:mb-6 animate-slide-down">
            Générez des revenus complémentaires grâce à l'analyse publicitaire
          </h1>
          
          {/* LocationFeed with increased width on desktop */}
          <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl mb-4 md:mb-6 animate-fade-in">
            <LocationFeed />
          </div>
          
          {/* Counters with more realistic targets */}
          <StatsCounter />
          
          {/* Network Effect Message - Updated messaging for credibility */}
          <div className="text-sm text-center bg-blue-900/30 dark:bg-blue-900/30 dark:text-blue-200 text-blue-800 
            p-3 rounded-lg mb-4 max-w-2xl border border-blue-200/20 shadow-sm">
            <p className="font-medium">Optimisation collaborative : Notre technologie s'améliore avec chaque utilisateur.</p>
            <p>Plus notre communauté s'agrandit, plus nos algorithmes d'analyse deviennent performants pour tous.</p>
          </div>
          
          {/* CTA Button */}
          <HeroCallToAction />
        </div>
      </div>
    </section>
  );
};

export default Hero;
