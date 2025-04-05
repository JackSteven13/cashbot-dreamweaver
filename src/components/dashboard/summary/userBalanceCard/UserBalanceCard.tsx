
import React, { useState, useEffect } from 'react';
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
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  displayBalance,
  subscription,
  dailyLimit,
  sessionsDisplay = 'illimitées',
  referralCount = 0,
  referralBonus = 0,
  networkGains,
  botGains,
  totalGeneratedBalance,
  lastSessionTimestamp
}) => {
  // Ensure we have valid values or defaults for calculated fields
  const safeNetworkGains = networkGains !== undefined ? networkGains : (displayBalance * 0.3);
  const safeBotGains = botGains !== undefined ? botGains : (displayBalance * 0.7);
  const safeTotalGeneratedBalance = totalGeneratedBalance !== undefined ? totalGeneratedBalance : (displayBalance * 1.2);
  
  const withdrawalThreshold = WITHDRAWAL_THRESHOLDS[subscription as keyof typeof WITHDRAWAL_THRESHOLDS] || 200;
  const [glowActive, setGlowActive] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(displayBalance);
  const [previousBalance, setPreviousBalance] = useState(displayBalance);
  
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      const newAmount = e.detail?.amount || 0;
      setPreviousBalance(displayBalance);
      setBalanceAnimating(true);
      
      const startValue = displayBalance;
      const endValue = displayBalance + newAmount;
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
        }
      };
      
      requestAnimationFrame(updateValue);
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    return () => window.removeEventListener('balance:update' as any, handleBalanceUpdate);
  }, [displayBalance]);
  
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
          displayBalance={displayBalance}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={safeTotalGeneratedBalance}
        />
        
        <ProgressBar 
          displayBalance={displayBalance} 
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
