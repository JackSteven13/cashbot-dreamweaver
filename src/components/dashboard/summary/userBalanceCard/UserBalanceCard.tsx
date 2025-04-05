
import React, { useState, useEffect, useRef } from 'react';
import { WITHDRAWAL_THRESHOLDS } from '@/components/dashboard/summary/constants';

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
  // Ensure we have valid values or defaults for calculated fields
  const [localBalance, setLocalBalance] = useState(displayBalance);
  const highestBalanceRef = useRef<number>(displayBalance);
  const safeReferralBonus = typeof referralBonus === 'number' ? referralBonus : 0;
  
  // Initialiser avec la valeur maximum disponible
  useEffect(() => {
    try {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
      
      // Calculer le maximum
      let maxBalance = displayBalance;
      
      if (storedHighestBalance) {
        const parsed = parseFloat(storedHighestBalance);
        if (!isNaN(parsed) && parsed > maxBalance) {
          maxBalance = parsed;
          highestBalanceRef.current = parsed;
        }
      }
      
      if (storedBalance) {
        const parsed = parseFloat(storedBalance);
        if (!isNaN(parsed) && parsed > maxBalance) {
          maxBalance = parsed;
          highestBalanceRef.current = parsed;
        }
      }
      
      if (storedLastKnownBalance) {
        const parsed = parseFloat(storedLastKnownBalance);
        if (!isNaN(parsed) && parsed > maxBalance) {
          maxBalance = parsed;
          highestBalanceRef.current = parsed;
        }
      }
      
      // Utiliser la valeur maximale pour l'affichage
      setLocalBalance(maxBalance);
      
      // Confirmer que la valeur maximum est bien stockée
      localStorage.setItem('highestBalance', highestBalanceRef.current.toString());
    } catch (e) {
      console.error("Failed to read balance from localStorage:", e);
    }
  }, []);
  
  // Mettre à jour le solde local uniquement si le solde affiché est plus élevé
  useEffect(() => {
    if (displayBalance > localBalance) {
      console.log(`[UserBalanceCard] Updating local balance: ${localBalance} -> ${displayBalance}`);
      setLocalBalance(displayBalance);
      
      if (displayBalance > highestBalanceRef.current) {
        highestBalanceRef.current = displayBalance;
        localStorage.setItem('highestBalance', displayBalance.toString());
      }
    } else {
      // Si le solde est inférieur, vérifier si notre solde local est correct
      const storedHighestBalance = localStorage.getItem('highestBalance');
      if (storedHighestBalance) {
        const parsed = parseFloat(storedHighestBalance);
        if (!isNaN(parsed) && parsed > localBalance) {
          console.log(`[UserBalanceCard] Restoring from higher stored balance: ${parsed}`);
          setLocalBalance(parsed);
          highestBalanceRef.current = parsed;
        }
      }
    }
  }, [displayBalance, localBalance]);
  
  // Écouter les événements de synchronisation forcée
  useEffect(() => {
    const handleForceSyncBalance = (event: CustomEvent) => {
      const syncedBalance = event.detail?.balance;
      if (typeof syncedBalance === 'number' && syncedBalance > 0) {
        // Ne mettre à jour que si le solde synchronisé est plus élevé
        if (syncedBalance > localBalance) {
          console.log(`[UserBalanceCard] Force sync balance update: ${syncedBalance}`);
          setLocalBalance(syncedBalance);
          
          if (syncedBalance > highestBalanceRef.current) {
            highestBalanceRef.current = syncedBalance;
          }
        }
      }
    };
    
    window.addEventListener('balance:force-sync' as any, handleForceSyncBalance);
    
    return () => {
      window.removeEventListener('balance:force-sync' as any, handleForceSyncBalance);
    };
  }, [localBalance]);
  
  // Calculer les gains dérivés en fonction du solde local
  const safeNetworkGains = networkGains !== undefined ? networkGains : (localBalance * 0.3);
  const safeBotGains = botGains !== undefined ? botGains : (localBalance * 0.7);
  const safeTotalGeneratedBalance = totalGeneratedBalance !== undefined ? totalGeneratedBalance : (localBalance * 1.2);
  
  // Get withdrawal threshold for this subscription type
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  
  // State for UI effects
  const [glowActive, setGlowActive] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(localBalance);
  const [previousBalance, setPreviousBalance] = useState(localBalance);
  
  // Handle balance update events
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      const newAmount = e.detail?.amount || 0;
      const newCurrentBalance = e.detail?.currentBalance;
      
      // Utiliser le solde fourni ou calculer
      let updatedBalance = localBalance;
      if (typeof newCurrentBalance === 'number') {
        updatedBalance = Math.max(localBalance, newCurrentBalance);
      } else {
        updatedBalance = localBalance + newAmount;
      }
      
      // N'animer que si le nouveau solde est plus élevé
      if (updatedBalance > localBalance) {
        setPreviousBalance(localBalance);
        setBalanceAnimating(true);
        
        const startValue = localBalance;
        const endValue = updatedBalance;
        const duration = 1000;
        const startTime = Date.now();
        
        const updateValue = () => {
          const now = Date.now();
          const elapsed = now - startTime;
          
          if (elapsed < duration) {
            const progress = elapsed / duration;
            const currentValue = startValue + (endValue - startValue) * progress;
            setAnimatedBalance(currentValue);
            requestAnimationFrame(updateValue);
          } else {
            setAnimatedBalance(endValue);
            setBalanceAnimating(false);
            setLocalBalance(endValue);
            
            // Mettre à jour notre référence maximum
            if (endValue > highestBalanceRef.current) {
              highestBalanceRef.current = endValue;
              localStorage.setItem('highestBalance', endValue.toString());
            }
          }
        };
        
        requestAnimationFrame(updateValue);
      }
    };
    
    // Écouter les mises à jour forcées du solde
    const handleForceBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number' && newBalance > localBalance) {
        setPreviousBalance(localBalance);
        setAnimatedBalance(newBalance);
        setBalanceAnimating(true);
        
        setTimeout(() => {
          setBalanceAnimating(false);
          setLocalBalance(newBalance);
          
          // Mettre à jour notre référence maximum
          if (newBalance > highestBalanceRef.current) {
            highestBalanceRef.current = newBalance;
            localStorage.setItem('highestBalance', newBalance.toString());
          }
        }, 1000);
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    };
  }, [localBalance]);
  
  // Periodic glow effect
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 3000);
    }, Math.random() * 5000 + 2000);
    
    const intervalTimer = setInterval(() => {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 3000);
    }, Math.random() * 10000 + 15000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);
  
  // Activate glow during balance animation
  useEffect(() => {
    if (balanceAnimating) {
      setGlowActive(true);
    } else {
      setTimeout(() => setGlowActive(false), 3000);
    }
  }, [balanceAnimating]);
  
  return (
    <div className="mb-6">
      <div className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white transition-all duration-500 ${glowActive ? 'glow-effect' : ''}`}>
        <BalanceHeader dailyLimit={dailyLimit} />
        
        <BalanceDisplay 
          displayBalance={balanceAnimating ? previousBalance : localBalance}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={safeReferralBonus}
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
          referralBonus={safeReferralBonus}
        />
        
        <div className="mt-3 text-xs text-white/50 italic">
          * Les gains bots sont estimatifs et peuvent varier
        </div>
      </div>
    </div>
  );
};

export default UserBalanceCard;
