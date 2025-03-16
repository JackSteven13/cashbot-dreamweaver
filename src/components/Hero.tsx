
import { useIsMobile } from '../hooks/use-mobile';
import LocationFeed from './LocationFeed';
import BackgroundElements from './hero/BackgroundElements';
import HeroCallToAction from './hero/HeroCallToAction';
import MapComponent from './hero/MapComponent';
import StatsCounter from './hero/StatsCounter';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative overflow-hidden pt-16 pb-10 md:pt-32 md:pb-16">
      {/* Background Elements */}
      <BackgroundElements />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-6 md:mb-8 animate-slide-down">
            Générez des revenus passifs simplement et automatiquement avec CashBot. 💸
          </h1>
          
          {/* Map for desktop, LocationFeed for mobile */}
          {isMobile ? (
            <div className="w-full max-w-lg mb-6 md:mb-8 animate-fade-in">
              <LocationFeed />
            </div>
          ) : (
            <MapComponent />
          )}
          
          {/* Counters - Improved for better responsive display */}
          <StatsCounter />
          
          {/* CTA Button */}
          <HeroCallToAction />
        </div>
      </div>
    </section>
  );
};

export default Hero;
