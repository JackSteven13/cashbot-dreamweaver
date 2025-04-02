
import React from 'react';
import { CheckCircle, Monitor, DollarSign, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HowItWorks = () => {
  const isMobile = useIsMobile();
  
  const steps = [
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Configuration Automatique",
      description: "Notre système se configure automatiquement sur votre compte sans installation complexe."
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Visionnage Intelligent",
      description: "Notre technologie visionne automatiquement des publicités ciblées et optimisées pour maximiser vos revenus."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analyse et Optimisation",
      description: "Nos algorithmes analysent en permanence les performances pour optimiser vos gains en continu."
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Génération de Revenus",
      description: "Vous générez des revenus passifs que vous pouvez retirer directement sur votre compte bancaire."
    }
  ];

  return (
    <section className={`${isMobile ? 'py-12' : 'py-20'} bg-gradient-subtle`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Comment Ça Marche</h2>
          <p className="text-base md:text-lg text-muted-foreground">Un processus simple et efficace pour générer des revenus complémentaires</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                {step.icon}
              </div>
              <div className="relative mb-4">
                <span className="absolute -left-4 -top-1 text-4xl font-bold text-primary/10">{index + 1}</span>
                <h3 className="text-xl font-semibold mb-2 relative z-10">{step.title}</h3>
              </div>
              <p className="text-muted-foreground">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                  <svg className="w-6 h-6 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-lg font-medium">Notre technologie s'améliore constamment pour maximiser vos revenus</p>
          <p className="text-muted-foreground mt-2">Pas de compétences techniques requises - Notre système fait tout pour vous</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
