
import React, { useState, useEffect } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Bot, DollarSign, TrendingUp } from 'lucide-react';

const AutoProgressNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counter, setCounter] = useState(0);
  const [gain, setGain] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail?.automatic) {
        const amount = event.detail?.amount || 0;
        
        // Incrémenter le gain accumulé
        setGain(prev => parseFloat((prev + amount).toFixed(2)));
        
        // Incrémenter le compteur d'analyses
        setCounter(prev => prev + 1);
        
        // Afficher la notification
        setIsVisible(true);
        
        // Cacher après 5 secondes
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        
        return () => clearTimeout(hideTimer);
      }
    };
    
    // Reset périodique des compteurs
    const resetInterval = setInterval(() => {
      setCounter(0);
      setGain(0);
    }, 300000); // Reset toutes les 5 minutes
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      clearInterval(resetInterval);
    };
  }, []);
  
  // Ne rien afficher si pas de génération
  if (!isVisible || counter === 0) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <div 
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse-slow cursor-pointer z-50"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Bot className="h-4 w-4" />
            <span className="text-sm font-medium">{counter} analyses</span>
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">+{gain.toFixed(2)}€</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-blue-800 text-white border-blue-900">
          <div className="p-1">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4" />
              <span className="font-medium">Bot d'analyse actif</span>
            </div>
            <div className="text-xs opacity-90">
              Analyses en cours pour générer des revenus automatiquement
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>Génération continue 24/7</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AutoProgressNotification;
