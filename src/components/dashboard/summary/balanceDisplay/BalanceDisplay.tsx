
import React, { useState, useEffect } from 'react';
import BalanceHeader from './BalanceHeader';
import BalanceAmount from './BalanceAmount';
import { Card } from '@/components/ui/card';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/auth/subscriptionUtils';
import balanceManager from '@/utils/balance/balanceManager';
import { Progress } from '@/components/ui/progress';
import { BalanceAlertBanner } from './BalanceAlertBanner';
import { useIsMobile } from '@/hooks/use-mobile';

interface BalanceDisplayProps {
  balance: number;
  subscription: string;
  isLoading?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  subscription,
  isLoading = false
}) => {
  const [dailyGains, setDailyGains] = useState(0);
  const isMobile = useIsMobile();
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [limitPercentage, setLimitPercentage] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isNearLimit, setIsNearLimit] = useState(false);

  // Mettre à jour les états basés sur les limites
  useEffect(() => {
    // Récupérer l'abonnement effectif (tenant compte des périodes d'essai, etc.)
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);

    // Récupérer les gains du jour depuis le gestionnaire de solde
    const todaysGains = balanceManager.getDailyGains();
    setDailyGains(todaysGains);
    
    // Récupérer la limite quotidienne basée sur l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer le pourcentage d'utilisation de la limite quotidienne
    const percentage = Math.min(100, (todaysGains / dailyLimit) * 100);
    setLimitPercentage(percentage);
    
    // Vérifier si la limite est atteinte ou presque atteinte
    setIsLimitReached(percentage >= 99);
    setIsNearLimit(percentage >= 85 && percentage < 99);
    
    // Actualiser périodiquement
    const intervalId = setInterval(() => {
      const updatedGains = balanceManager.getDailyGains();
      setDailyGains(updatedGains);
      const updatedPercentage = Math.min(100, (updatedGains / dailyLimit) * 100);
      setLimitPercentage(updatedPercentage);
      setIsLimitReached(updatedPercentage >= 99);
      setIsNearLimit(updatedPercentage >= 85 && updatedPercentage < 99);
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => clearInterval(intervalId);
  }, [subscription, balance]);

  // Écouter les événements de mise à jour de solde
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const updatedGains = balanceManager.getDailyGains();
      setDailyGains(updatedGains);
      
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const percentage = Math.min(100, (updatedGains / dailyLimit) * 100);
      
      setLimitPercentage(percentage);
      setIsLimitReached(percentage >= 99);
      setIsNearLimit(percentage >= 85 && percentage < 99);
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('daily:gains:update', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('daily:gains:update', handleBalanceUpdate);
    };
  }, [effectiveSubscription]);

  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;

  return (
    <div className="space-y-4">
      {isLimitReached && (
        <BalanceAlertBanner 
          type="limit-reached" 
          dailyLimit={dailyLimit} 
          subscription={effectiveSubscription}
        />
      )}
      
      {!isLimitReached && isNearLimit && (
        <BalanceAlertBanner 
          type="near-limit" 
          dailyLimit={dailyLimit} 
          subscription={effectiveSubscription} 
          percentage={limitPercentage}
        />
      )}
      
      <Card className="overflow-hidden bg-black/70 dark:bg-gray-900/70 border-slate-700">
        <div className="p-4 md:p-6">
          <BalanceHeader />
          <BalanceAmount 
            balance={balance} 
            isLoading={isLoading} 
          />
          
          <div className="text-sm text-gray-400 mb-2 mt-4">
            <div className="flex justify-between">
              <span>Limite quotidienne ({dailyLimit.toFixed(2)}€):</span>
              <span className={isLimitReached ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-green-400"}>
                {dailyGains.toFixed(2)}€ ({Math.round(limitPercentage)}%)
              </span>
            </div>
          </div>
          
          <Progress 
            value={limitPercentage} 
            className="h-2 bg-slate-700"
            aria-label="Progression de la limite quotidienne"
          >
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                limitPercentage >= 99 
                  ? 'bg-red-500' 
                  : limitPercentage >= 85 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${limitPercentage}%` }}
            />
          </Progress>
          
          <div className="text-xs text-slate-500 text-right mt-1">
            Plan: {effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BalanceDisplay;
