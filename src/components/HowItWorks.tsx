
import React from 'react';
import { CheckCircle, Monitor, DollarSign, BarChart3, Bot } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HowItWorks = () => {
  const isMobile = useIsMobile();
  
  const steps = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Agents IA Avancés",
      description: "Nos agents d'intelligence artificielle travaillent en parallèle pour optimiser continuellement vos revenus."
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Configuration Automatique",
      description: "Notre système déploie automatiquement les agents IA sur votre compte sans installation complexe."
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Visionnage Intelligent",
      description: "Les agents IA visionnent simultanément des publicités ciblées pour maximiser vos revenus."
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
          <p className="text-base md:text-lg text-muted-foreground">Notre technologie d'agents IA génère des revenus pour vous 24h/24, 7j/7</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative flex flex-col items-center text-center glass-card p-6 md:p-8 rounded-xl hover:shadow-lg transition-all duration-300 mb-8 md:mb-0"
            >
              <div className="flex items-center justify-center w-full mb-4">
                <div className="relative">
                  <div className="absolute -left-2 -top-8 text-7xl font-bold text-primary/10 opacity-70">
                    {index + 1}
                  </div>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 mt-2 relative z-10">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              
              {index < steps.length - 1 && !isMobile && (
                <div className="hidden lg:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                  <svg className="w-6 h-6 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
