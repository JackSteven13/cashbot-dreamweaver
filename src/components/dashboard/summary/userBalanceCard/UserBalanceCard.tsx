
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
  const safeDisplayBalance = typeof displayBalance === 'number' ? displayBalance : 0;
  const safeNetworkGains = networkGains !== undefined ? networkGains : (safeDisplayBalance * 0.3);
  const safeBotGains = botGains !== undefined ? botGains : (safeDisplayBalance * 0.7);
  const safeTotalGeneratedBalance = totalGeneratedBalance !== undefined ? totalGeneratedBalance : (safeDisplayBalance * 1.2);
  const safeReferralBonus = typeof referralBonus === 'number' ? referralBonus : 0;
  
  // Utiliser une référence pour suivre le solde local entre les rendus
  const currentBalanceRef = useRef(safeDisplayBalance);
  
  // Get withdrawal threshold for this subscription type
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  
  // State for UI effects
  const [glowActive, setGlowActive] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(safeDisplayBalance);
  const [previousBalance, setPreviousBalance] = useState(safeDisplayBalance);
  
  // Update local ref when display balance changes
  useEffect(() => {
    if (currentBalanceRef.current !== safeDisplayBalance) {
      console.log("Balance prop changed to:", safeDisplayBalance);
      currentBalanceRef.current = safeDisplayBalance;
    }
  }, [safeDisplayBalance]);
  
  // Handle balance update events
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      const newAmount = e.detail?.amount || 0;
      const newCurrentBalance = e.detail?.currentBalance;
      
      if (typeof newCurrentBalance === 'number') {
        currentBalanceRef.current = newCurrentBalance;
      }
      
      setPreviousBalance(currentBalanceRef.current);
      setBalanceAnimating(true);
      
      const startValue = currentBalanceRef.current;
      const endValue = currentBalanceRef.current + newAmount;
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
          
          // Mettre à jour notre référence locale après l'animation
          currentBalanceRef.current = endValue;
        }
      };
      
      requestAnimationFrame(updateValue);
    };
    
    // Écouter les mises à jour forcées du solde
    const handleForceBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        currentBalanceRef.current = newBalance;
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    };
  }, []);
  
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
          displayBalance={balanceAnimating ? previousBalance : currentBalanceRef.current}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={safeReferralBonus}
          totalGeneratedBalance={safeTotalGeneratedBalance}
          isBotActive={isBotActive}
        />
        
        <ProgressBar 
          displayBalance={currentBalanceRef.current}
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
