
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';

interface SystemProgressBarProps {
  displayBalance: number;
  dailyLimit: number;
  limitPercentage: number;
  subscription: string;
  botActive?: boolean;
}

export const SystemProgressBar: React.FC<SystemProgressBarProps> = ({ 
  displayBalance, 
  dailyLimit,
  limitPercentage,
  subscription,
  botActive = true
}) => {
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  const [calculatedPercentage, setCalculatedPercentage] = useState(limitPercentage);
  const [localBotActive, setLocalBotActive] = useState(botActive);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
    // Calculer le pourcentage et vérifier si la limite est atteinte
    const percentage = Math.min(100, limitPercentage);
    setCalculatedPercentage(percentage);
    
    // Si le pourcentage atteint 100%, désactiver le bot
    if (percentage >= 100 && localBotActive) {
      setLocalBotActive(false);
    }
  }, [subscription, displayBalance, dailyLimit, limitPercentage, localBotActive]);
  
  // Écouter les changements de statut du bot provenant d'autres composants
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setLocalBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    // Synchroniser avec la prop botActive
    setLocalBotActive(botActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, [botActive]);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300 flex items-center">
          <span className="text-blue-300 mr-2">{limitPercentage.toFixed(0)}%</span> / {effectiveLimit}€ par jour
          
          {/* Indicateur d'état du bot amélioré */}
          <span className={`ml-2 inline-flex h-2 w-2 rounded-full ${localBotActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="ml-1 text-xs text-gray-400">{localBotActive ? 'Bot actif' : 'Bot inactif'}</span>
        </div>
      </div>
      <Progress value={calculatedPercentage} className="h-2 bg-slate-700">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            calculatedPercentage >= 100 
              ? 'bg-red-500' 
              : calculatedPercentage > 80 
                ? 'bg-orange-400' 
                : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}
          style={{ width: `${calculatedPercentage}%` }}
        />
      </Progress>
      <div className="mt-1 text-xs text-gray-400">
        <span>Solde total: <span className="text-white">{displayBalance.toFixed(2)}€</span></span>
        <span className="float-right text-gray-400 text-xs">
          (Limite: gains de {effectiveLimit}€/jour)
        </span>
      </div>
    </div>
  );
};
