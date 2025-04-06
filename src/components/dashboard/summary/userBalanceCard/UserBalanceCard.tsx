
import React, { useState, useEffect } from 'react';
import { WITHDRAWAL_THRESHOLDS } from '@/components/dashboard/summary/constants';
import { balanceManager } from '@/utils/balance/balanceManager';

// Import subcomponents
import { 
  BalanceHeader,
  BalanceDisplay, 
  ProgressBar, 
  SubscriptionInfo, 
  GainsDisplay, 
  ReferralInfo 
} from './components';

interface UserBalanceCardProps {
  displayBalance: number;
  balance?: number;
  subscription: string;
  dailyLimit: number;
  referralCount?: number;
  referralBonus?: number;
  networkGains?: number;
  botGains?: number;
  totalGeneratedBalance?: number;
  lastSessionTimestamp?: string;
  sessionsDisplay?: string;
  isBotActive?: boolean;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance = 0,
  subscription = 'freemium',
  dailyLimit = 0.5,
  sessionsDisplay = 'illimitées',
  referralCount = 0,
  referralBonus = 0,
  networkGains,
  botGains,
  totalGeneratedBalance,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // État local pour l'affichage du solde
  const [localBalance, setLocalBalance] = useState(displayBalance);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const [previousBalance, setPreviousBalance] = useState(displayBalance);
  const [glowActive, setGlowActive] = useState(false);
  
  // Initialiser le gestionnaire de solde avec la valeur de départ
  useEffect(() => {
    balanceManager.initialize(displayBalance);
    
    // S'abonner aux mises à jour du gestionnaire de solde
    const unsubscribe = balanceManager.subscribe((state) => {
      // Si une mise à jour du solde se produit, l'animer
      if (state.lastKnownBalance !== localBalance) {
        animateBalanceChange(localBalance, state.lastKnownBalance);
      }
    });
    
    return () => {
      unsubscribe(); // Se désabonner à la destruction du composant
    };
  }, []);
  
  // N'accepter les mises à jour de props displayBalance que si supérieures
  useEffect(() => {
    if (displayBalance > localBalance) {
      animateBalanceChange(localBalance, displayBalance);
    }
  }, [displayBalance]);
  
  // Fonction pour animer un changement de solde
  const animateBalanceChange = (from: number, to: number) => {
    if (to <= from) return;
    
    setPreviousBalance(from);
    setBalanceAnimating(true);
    setGlowActive(true);
    
    const startValue = from;
    const endValue = to;
    const duration = 1000;
    const startTime = Date.now();
    
    const updateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed < duration) {
        const progress = elapsed / duration;
        // Utiliser une fonction easing pour une animation plus fluide
        const eased = -Math.pow(progress - 1, 2) + 1; // easeOutQuad
        const currentValue = startValue + (endValue - startValue) * eased;
        setAnimatedBalance(currentValue);
        requestAnimationFrame(updateValue);
      } else {
        setAnimatedBalance(endValue);
        setLocalBalance(endValue);
        setBalanceAnimating(false);
        
        // Désactiver l'effet glow après un délai
        setTimeout(() => {
          setGlowActive(false);
        }, 3000);
      }
    };
    
    requestAnimationFrame(updateValue);
  };
  
  // Écouter les événements de l'application
  useEffect(() => {
    // Gérer les mises à jour cohérentes du solde
    const handleConsistentUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.currentBalance;
      if (typeof newBalance === 'number' && newBalance > localBalance) {
        animateBalanceChange(localBalance, newBalance);
      }
    };
    
    // Gérer les réinitialisations de solde
    const handleBalanceReset = () => {
      animateBalanceChange(localBalance, 0);
    };
    
    window.addEventListener('balance:consistent-update' as any, handleConsistentUpdate);
    window.addEventListener('balance:reset' as any, handleBalanceReset);
    
    return () => {
      window.removeEventListener('balance:consistent-update' as any, handleConsistentUpdate);
      window.removeEventListener('balance:reset' as any, handleBalanceReset);
    };
  }, [localBalance]);
  
  // Calculer les gains dérivés en fonction du solde local
  const safeNetworkGains = networkGains !== undefined ? networkGains : (localBalance * 0.3);
  const safeBotGains = botGains !== undefined ? botGains : (localBalance * 0.7);
  const safeTotalGeneratedBalance = totalGeneratedBalance !== undefined ? totalGeneratedBalance : (localBalance * 1.2);
  
  // Get withdrawal threshold for this subscription type
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  
  return (
    <div className="mb-6">
      <div className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white transition-all duration-500 ${glowActive ? 'glow-effect' : ''}`}>
        <BalanceHeader dailyLimit={dailyLimit} />
        
        <BalanceDisplay 
          displayBalance={localBalance}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={safeTotalGeneratedBalance}
          isBotActive={isBotActive}
        />
        
        <ProgressBar 
          displayBalance={localBalance}
          withdrawalThreshold={withdrawalThreshold} 
        />
        
        <SubscriptionInfo 
          subscription={subscription}
          sessionsDisplay={sessionsDisplay}
        />
        
        <GainsDisplay 
          networkGains={safeNetworkGains}
          botGains={safeBotGains}
        />
        
        <ReferralInfo 
          referralCount={referralCount}
          referralBonus={referralBonus}
        />
        
        <div className="mt-3 text-xs text-white/50 italic">
          * Les gains bots sont estimatifs et peuvent varier
        </div>
      </div>
    </div>
  );
};

export default UserBalanceCard;
