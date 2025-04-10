
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { toast } from "@/components/ui/use-toast";

export interface SystemProgressBarProps {
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
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
    const percentage = Math.min(100, (displayBalance / limit) * 100);
    setCalculatedPercentage(percentage);
    
    const isLimitReached = percentage >= 100;
    setLimitReached(isLimitReached);
    
    if (isLimitReached && localBotActive) {
      setLocalBotActive(false);
      
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: false } 
      }));
      
      console.log("Limite atteinte dans SystemProgressBar, bot désactivé");
    }
  }, [subscription, displayBalance, dailyLimit, limitPercentage, localBotActive]);
  
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`SystemProgressBar received bot status update: ${isActive ? 'active' : 'inactive'}`);
        setLocalBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    setLocalBotActive(botActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, [botActive]);
  
  const toggleBotStatus = () => {
    if (limitReached && !localBotActive) {
      toast({
        title: "Impossible d'activer l'analyse",
        description: "Vous avez atteint votre limite journalière de gains. Revenez demain ou passez à un forfait supérieur.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    const newStatus = !localBotActive;
    console.log(`Toggling bot status from ${localBotActive} to ${newStatus}`);
    
    setLocalBotActive(newStatus);
    
    window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
      detail: { 
        active: newStatus,
        checkLimit: true,
        subscription: subscription,
        balance: displayBalance
      }
    }));
  };

  const getLimitStatusText = () => {
    const roundedPercentage = Math.round(calculatedPercentage);
    if (roundedPercentage >= 100) return "Limite atteinte";
    if (roundedPercentage >= 90) return "Presque atteinte";
    return `${roundedPercentage}%`;
  };

  const formattedDisplayBalance = typeof displayBalance === 'number' ? displayBalance.toFixed(2) : '0.00';

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300 flex items-center">
          <span className={`mr-2 ${limitReached ? 'text-red-400' : calculatedPercentage >= 90 ? 'text-orange-400' : 'text-blue-300'}`}>
            {getLimitStatusText()}
          </span> / {effectiveLimit}€ par jour
          
          <div 
            className="ml-2 flex items-center cursor-pointer" 
            onClick={toggleBotStatus}
            title={limitReached && !localBotActive 
              ? "Analyse impossible : limite journalière atteinte" 
              : "Cliquez pour activer/désactiver l'analyse automatique"
            }
          >
            <span className={`inline-flex h-2 w-2 rounded-full ${
              limitReached ? 'bg-red-500' : (localBotActive ? 'bg-green-500' : 'bg-red-500')
            }`}></span>
            <span className="ml-1 text-xs text-gray-400">
              {limitReached ? 'Limite atteinte' : (localBotActive ? 'Bot actif' : 'Bot inactif')}
            </span>
          </div>
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
      <div className="mt-1 text-xs text-gray-400 flex justify-between w-full">
        <span>Solde total: <span className="text-white">{formattedDisplayBalance}€</span></span>
        <span className="text-gray-400 text-xs">
          {limitReached ? (
            <span className="text-red-400">Limite atteinte</span>
          ) : (
            <span>(Limite: {effectiveLimit}€/jour)</span>
          )}
        </span>
      </div>
    </div>
  );
};
