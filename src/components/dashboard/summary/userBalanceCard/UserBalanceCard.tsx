
import React, { useState, useEffect, useMemo } from 'react';
import BalanceDisplay from './components/BalanceDisplay';
import GainsDisplay from './components/GainsDisplay';
import SubscriptionLevelDisplay from './components/SubscriptionLevelDisplay';
import BalanceChart from './components/BalanceChart';

interface UserBalanceCardProps {
  displayBalance: number;
  subscription: string;
  dailyLimit: number;
  limitPercentage: number;
  referralCount: number;
  referralBonus: number;
  botActive?: boolean;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({ 
  displayBalance,
  subscription,
  dailyLimit,
  limitPercentage,
  referralCount,
  referralBonus,
  botActive
}) => {
  // États pour l'animation du solde
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const [previousBalance, setPreviousBalance] = useState(displayBalance);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  
  // Calculer les valeurs dérivées pour l'affichage
  const totalGenerated = useMemo(() => {
    return Math.max(displayBalance * 1.2, displayBalance + 0.5);
  }, [displayBalance]);
  
  // Temporairement découpler le solde de l'animation (pour éviter les erreurs visuelles)
  useEffect(() => {
    if (!balanceAnimating && displayBalance !== animatedBalance) {
      setPreviousBalance(animatedBalance);
      setAnimatedBalance(displayBalance);
    }
  }, [displayBalance, balanceAnimating, animatedBalance]);
  
  // Effet pour animer les changements de solde via l'événement balance:update
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount || 0;
      
      // Ne déclencher que si nous avons un montant significatif
      if (amount > 0) {
        setPreviousBalance(animatedBalance);
        setBalanceAnimating(true);
        
        // Animation simple pour le changement de solde
        const newBalance = animatedBalance + amount;
        setAnimatedBalance(newBalance);
        
        // Réinitialiser l'état d'animation après un délai
        setTimeout(() => {
          setBalanceAnimating(false);
        }, 2000);
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [animatedBalance]);

  return (
    <div className="user-balance-card p-6 bg-slate-800/60 rounded-lg shadow-lg border border-slate-700/50">
      <BalanceDisplay 
        displayBalance={displayBalance}
        balanceAnimating={balanceAnimating} 
        animatedBalance={animatedBalance} 
        previousBalance={previousBalance}
        referralBonus={referralBonus}
        totalGeneratedBalance={totalGenerated}
        isBotActive={botActive}
        subscription={subscription}
      />
      
      <div className="my-4 border-t border-b border-slate-700/50 py-3">
        <SubscriptionLevelDisplay 
          subscription={subscription}
          referralCount={referralCount}
          limitPercentage={limitPercentage}
          dailyLimit={dailyLimit}
        />
      </div>
      
      <GainsDisplay 
        networkGains={referralBonus || 0}
        botGains={Math.max(0, displayBalance - (referralBonus || 0))}
      />
      
      <div className="mt-5 pt-3 border-t border-slate-700/50">
        <BalanceChart 
          balance={displayBalance} 
          subscription={subscription}
          dailyLimit={dailyLimit}
        />
      </div>
    </div>
  );
};

export default UserBalanceCard;
