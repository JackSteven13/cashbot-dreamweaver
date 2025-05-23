
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { toast } from "@/components/ui/use-toast";

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
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
    const percentage = Math.min(100, (displayBalance / limit) * 100);
    setCalculatedPercentage(percentage);
    
    const isLimitReached = percentage >= 90;
    setLimitReached(isLimitReached);
    
    if (isLimitReached && localBotActive) {
      setLocalBotActive(false);
      
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: false } 
      }));
      
      localStorage.setItem('botActive', 'false');
      
      console.log("Limit almost reached in SystemProgressBar, bot disabled");
      
      toast({
        title: "Limite journalière presque atteinte",
        description: `Vous approchez de votre limite journalière de ${limit.toFixed(2)}€. Le bot est maintenant en pause.`,
        variant: "destructive", // Changed from "warning" to "destructive"
        duration: 6000
      });
    }
  }, [subscription, displayBalance, dailyLimit, limitPercentage, localBotActive]);
  
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      const checkLimit = event.detail?.checkLimit;
      
      if (typeof isActive === 'boolean') {
        console.log(`SystemProgressBar received bot status update: ${isActive ? 'active' : 'inactive'}`);
        
        if (isActive && limitReached && checkLimit) {
          console.log("Attempt to activate bot with limit almost reached, blocked");
          
          window.dispatchEvent(new CustomEvent('bot:force-status', { 
            detail: { active: false, reason: 'limit_reached' } 
          }));
          
          localStorage.setItem('botActive', 'false');
          
          toast({
            title: "Limite journalière atteinte",
            description: `Vous avez atteint votre limite de gain journalier de ${effectiveLimit.toFixed(2)}€. Revenez demain ou passez à un forfait supérieur.`,
            variant: "destructive", // Changed from "warning" to "destructive"
            duration: 5000
          });
        } else {
          setLocalBotActive(isActive);
        }
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    setLocalBotActive(botActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [botActive, limitReached, effectiveLimit]);
  
  const toggleBotStatus = () => {
    if (limitReached && !localBotActive) {
      toast({
        title: "Impossible d'activer l'analyse",
        description: `Vous approchez de votre limite journalière de ${effectiveLimit.toFixed(2)}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive", // Changed from "warning" to "destructive"
        duration: 5000
      });
      return;
    }
    
    const newStatus = !localBotActive;
    console.log(`Toggling bot status from ${localBotActive} to ${newStatus}`);
    
    setLocalBotActive(newStatus);
    
    localStorage.setItem('botActive', newStatus.toString());
    
    window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
      detail: { 
        active: newStatus,
        checkLimit: true,
        subscription: subscription,
        balance: displayBalance
      }
    }));
  };

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs font-medium text-gray-300">
          Progression de la limite journalière
        </div>
        <div className="text-xs font-medium text-gray-300 flex items-center">
          <span className={`mr-2 ${limitReached ? 'text-red-400' : 'text-blue-300'}`}>
            {Math.round(calculatedPercentage)}%
          </span> / {effectiveLimit.toFixed(2)}€ par jour
          
          <div 
            className="ml-2 flex items-center cursor-pointer" 
            onClick={toggleBotStatus}
            title={limitReached && !localBotActive 
              ? "Analyse impossible : limite journalière presque atteinte" 
              : "Cliquez pour activer/désactiver l'analyse automatique"
            }
          >
            <span className={`inline-flex h-2 w-2 rounded-full ${
              limitReached ? 'bg-red-500' : (localBotActive ? 'bg-green-500' : 'bg-red-500')
            }`}></span>
            <span className="ml-1 text-xs text-gray-400">
              {limitReached ? 'Limite presque atteinte' : (localBotActive ? 'Bot actif' : 'Bot en pause')}
            </span>
          </div>
        </div>
      </div>
      <Progress value={calculatedPercentage} className="h-2 bg-slate-700">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            calculatedPercentage >= 90 
              ? 'bg-red-500' 
              : calculatedPercentage > 70 
                ? 'bg-orange-400' 
                : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}
          style={{ width: `${calculatedPercentage}%` }}
        />
      </Progress>
      <div className="mt-1 text-xs text-gray-400 flex justify-between w-full">
        <span>Solde total: <span className="text-white">{displayBalance.toFixed(2)}€</span></span>
        <span className="text-gray-400 text-xs">
          {limitReached ? (
            <span className="text-red-400">Limite presque atteinte</span>
          ) : (
            <span>(Limite: {effectiveLimit.toFixed(2)}€/jour)</span>
          )}
        </span>
      </div>
    </div>
  );
};
