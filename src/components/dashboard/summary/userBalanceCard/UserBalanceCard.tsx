
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import BalanceDisplay from './components/BalanceDisplay';
import SubscriptionLevelDisplay from './components/SubscriptionLevelDisplay';
import BalanceChart from './components/BalanceChart';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface UserBalanceCardProps {
  balance: number;
  referralBonus?: number;
  isNewUser?: boolean;
  subscription: string;
  isBotActive?: boolean;
  transactions?: any[];
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  balance,
  referralBonus = 0,
  isNewUser = false,
  subscription = 'freemium',
  isBotActive = true,
  transactions = []
}) => {
  const [animationState, setAnimationState] = useState({
    balanceAnimating: false,
    animatedBalance: balance,
    previousBalance: balance
  });
  
  // Mise à jour de l'état d'animation lorsque le solde change
  useEffect(() => {
    // Si le solde a changé
    if (balance !== animationState.animatedBalance) {
      setAnimationState(prev => ({
        balanceAnimating: true,
        animatedBalance: balance,
        previousBalance: prev.animatedBalance
      }));
      
      // Désactiver l'animation après un délai
      const timer = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          balanceAnimating: false
        }));
      }, 1000); // durée de l'animation
      
      return () => clearTimeout(timer);
    }
  }, [balance, animationState.animatedBalance]);
  
  // Obtenir la limite quotidienne selon l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calcul du pourcentage de la limite atteinte
  const limitPercentage = Math.min(100, (balance / dailyLimit) * 100);
  
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-slate-800/10 shadow-lg overflow-hidden">
      <div className="p-5">
        <BalanceDisplay 
          displayBalance={balance} 
          balanceAnimating={animationState.balanceAnimating}
          animatedBalance={animationState.animatedBalance}
          previousBalance={animationState.previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={balance * 1.0} // Pour l'instant, afficher le solde actuel
          isBotActive={isBotActive}
          subscription={subscription}
        />
        
        <div className="border-t border-slate-700/50 my-3"></div>
        
        <SubscriptionLevelDisplay 
          subscription={subscription}
          referralCount={0}
          limitPercentage={limitPercentage}
          dailyLimit={dailyLimit}
          isNewUser={isNewUser}
        />
        
        <div className="border-t border-slate-700/50 my-3"></div>
        
        <BalanceChart 
          balance={balance} 
          subscription={subscription}
          dailyLimit={dailyLimit}
          transactions={transactions} // Passer les transactions
        />
      </div>
    </Card>
  );
};

export default UserBalanceCard;
