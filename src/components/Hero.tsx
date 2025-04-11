
import { useIsMobile } from '../hooks/use-mobile';
import LocationFeed from './LocationFeed';
import BackgroundElements from './hero/BackgroundElements';
import HeroCallToAction from './hero/HeroCallToAction';
import StatsCounter from './hero/StatsCounter';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative overflow-hidden pt-20 md:pt-28 pb-6 md:pb-10">
      {/* Background Elements */}
      <BackgroundElements />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-4 md:mb-6 animate-slide-down">
            Gagnez automatiquement avec nos robots de visionnage vidéo
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-6 animate-fade-in">
            Des revenus passifs 24h/24 grâce à notre système qui visionne des publicités à votre place.
          </p>
          
          {/* LocationFeed with increased width on desktop */}
          <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl mb-4 md:mb-6 animate-fade-in">
            <LocationFeed />
          </div>
          
          {/* Counters with more realistic targets */}
          <StatsCounter />
          
          {/* CTA Button */}
          <HeroCallToAction />
        </div>
      </div>
    </section>
  );
};

export default Hero;
