
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
            Générez des revenus passifs simplement et automatiquement
          </h1>
          
          {/* Map for desktop, LocationFeed for mobile */}
          {isMobile ? (
            <div className="w-full max-w-lg mb-6 md:mb-8 animate-fade-in">
              <LocationFeed />
            </div>
          ) : (
            <MapComponent />
          )}
          
          {/* Counters - Using dramatically increased targets */}
          <StatsCounter 
            dailyAdsTarget={750000} 
            dailyRevenueTarget={3500000} 
          />
          
          {/* Network Effect Message */}
          <div className="text-sm text-center text-blue-200 bg-blue-900/30 p-3 rounded-lg mb-6 max-w-2xl">
            <p className="font-medium">Effet réseau puissant : Chaque nouvel utilisateur booste les performances globales.</p>
            <p>Plus il y a d'utilisateurs sur la plateforme, plus le CashBot traite de publicités et génère de revenus pour tous.</p>
          </div>
          
          {/* CTA Button */}
          <HeroCallToAction />
        </div>
      </div>
    </section>
  );
};

export default Hero;
