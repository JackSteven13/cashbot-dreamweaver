
import { useIsMobile } from '../hooks/use-mobile';
import BackgroundElements from './hero/BackgroundElements';
import HeroCallToAction from './hero/HeroCallToAction';
import MapComponent from './hero/MapComponent';
import StatsCounter from './hero/StatsCounter';
import { useState } from 'react';

const Hero = () => {
  const isMobile = useIsMobile();
  // Utiliser un état pour suivre la variante de visualisation actuelle
  const [visualizerVariant, setVisualizerVariant] = useState<'radar' | 'globe' | 'processor' | 'bars' | 'trend'>('processor');

  return (
    <section className="relative overflow-hidden pt-16 pb-10 md:pt-32 md:pb-16">
      {/* Background Elements */}
      <BackgroundElements />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance mb-6 md:mb-8 animate-slide-down">
            Générez des revenus passifs simplement et automatiquement
          </h1>
          
          {/* Map for desktop only */}
          {!isMobile && (
            <MapComponent />
          )}
          
          {/* Visualizer instead of LocationFeed for mobile */}
          {isMobile && (
            <StatsCounter 
              dailyAdsTarget={750000} 
              dailyRevenueTarget={3500000} 
              showVisualizer={true}
              visualizerVariant={visualizerVariant}
            />
          )}
          
          {/* Visualizer selector buttons - only on mobile */}
          {isMobile && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <button 
                onClick={() => setVisualizerVariant('processor')} 
                className={`px-3 py-1 text-xs rounded-full transition-colors ${visualizerVariant === 'processor' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}
              >
                IA Processor
              </button>
              <button 
                onClick={() => setVisualizerVariant('radar')} 
                className={`px-3 py-1 text-xs rounded-full transition-colors ${visualizerVariant === 'radar' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}
              >
                Radar
              </button>
              <button 
                onClick={() => setVisualizerVariant('globe')} 
                className={`px-3 py-1 text-xs rounded-full transition-colors ${visualizerVariant === 'globe' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}
              >
                Réseau Global
              </button>
              <button 
                onClick={() => setVisualizerVariant('bars')} 
                className={`px-3 py-1 text-xs rounded-full transition-colors ${visualizerVariant === 'bars' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}
              >
                Régions
              </button>
              <button 
                onClick={() => setVisualizerVariant('trend')} 
                className={`px-3 py-1 text-xs rounded-full transition-colors ${visualizerVariant === 'trend' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}
              >
                Tendance
              </button>
            </div>
          )}
          
          {/* Desktop stats counter */}
          {!isMobile && (
            <StatsCounter 
              dailyAdsTarget={750000} 
              dailyRevenueTarget={3500000}
            />
          )}
          
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
