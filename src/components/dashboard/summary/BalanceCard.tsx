import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BalanceDisplay from './userBalanceCard/components/BalanceDisplay';
import ActionButtons from './userBalanceCard/components/ActionButtons';
import GainProgress from './userBalanceCard/components/GainProgress';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { Sparkles } from 'lucide-react';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';
import balanceManager from '@/utils/balance/balanceManager';

interface BalanceCardProps {
  balance: number;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription?: string;
  canStartSession?: boolean;
  limitReached?: boolean;
  referralCount?: number;
  referralBonus?: number;
  isBotActive?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = 0,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  subscription = 'freemium',
  canStartSession = true,
  limitReached = false,
  referralCount = 0,
  referralBonus = 0,
  isBotActive = true
}) => {
  const [previousBalance, setPreviousBalance] = useState(balance);
  const [animatedBalance, setAnimatedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    return isNaN(managerBalance) ? balance : managerBalance;
  });
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [totalGeneratedBalance, setTotalGeneratedBalance] = useState(balance * 1.2);

  const balanceRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const balanceUpdateCountRef = useRef<number>(0);
  
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  useEffect(() => {
    const currentBalance = balanceManager.getCurrentBalance();
    if (!isNaN(currentBalance) && currentBalance > 0) {
      setAnimatedBalance(currentBalance);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      if (isNaN(newBalance)) return;
      
      if (Math.abs(newBalance - animatedBalance) > 0.001) {
        setPreviousBalance(animatedBalance);
        setAnimatedBalance(newBalance);
      }
    });
    
    return unsubscribe;
  }, [animatedBalance]);
  
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      const shouldAnimate = event.detail?.animate !== false;
      
      balanceUpdateCountRef.current += 1;
      const updateId = balanceUpdateCountRef.current;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        if (updateId !== balanceUpdateCountRef.current) return;
        
        const managerBalance = balanceManager.getCurrentBalance();
        
        if (!isNaN(managerBalance) && managerBalance > 0) {
          if (shouldAnimate && Math.abs(managerBalance - animatedBalance) > 0.01) {
            setPreviousBalance(animatedBalance);
            setBalanceAnimating(true);
            
            animateBalanceUpdate(
              animatedBalance,
              managerBalance,
              (value) => {
                setAnimatedBalance(value);
                if (Math.abs(value - managerBalance) < 0.01) setBalanceAnimating(false);
              },
              1500
            );
          } else {
            setAnimatedBalance(managerBalance);
          }
        }
      }, 300);
    };
    
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (typeof newBalance === 'number' && !isNaN(newBalance) && newBalance > 0) {
        if (Math.abs(newBalance - animatedBalance) < 0.01) return;
        
        setPreviousBalance(animatedBalance);
        
        if (shouldAnimate) {
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            newBalance,
            (value) => {
              setAnimatedBalance(value);
              if (Math.abs(value - newBalance) < 0.01) setBalanceAnimating(false);
            },
            1500
          );
        } else {
          setAnimatedBalance(newBalance);
        }
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('db:balance-updated' as any, handleForceUpdate);
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('db:balance-updated' as any, handleForceUpdate);
    };
  }, [animatedBalance]);
  
  useEffect(() => {
    const safeBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
    
    if (safeBalance > 0 && Math.abs(safeBalance - animatedBalance) > 0.05) {
      const managerBalance = balanceManager.getCurrentBalance();
      
      const effectiveBalance = Math.max(safeBalance, animatedBalance, managerBalance);
      
      if (Math.abs(effectiveBalance - animatedBalance) > 0.01) {
        setPreviousBalance(animatedBalance);
        
        if (!isNewUser) {
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            effectiveBalance,
            (value) => {
              setAnimatedBalance(value);
              if (Math.abs(value - effectiveBalance) < 0.01) setBalanceAnimating(false);
            },
            1000
          );
        } else {
          setAnimatedBalance(0);
        }
        
        if (effectiveBalance > managerBalance) {
          balanceManager.forceBalanceSync(effectiveBalance);
        }
      }
    }
  }, [balance, isNewUser, animatedBalance]);

  const displayBalance = isNewUser ? 0 : animatedBalance;

  return (
    <Card className="shadow-lg overflow-hidden bg-gradient-to-b from-blue-900 to-slate-900 text-white border-none" ref={balanceRef}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          Disponible
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4">
        <BalanceDisplay 
          displayBalance={displayBalance}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={totalGeneratedBalance}
          isBotActive={isBotActive}
          subscription={subscription}
        />
        
        <GainProgress 
          currentGain={displayBalance} 
          subscription={subscription}
          currentValue={displayBalance} 
          maxValue={dailyLimit} 
          showTooltip={true} 
          tooltipText={`Progression: ${displayBalance.toFixed(2)}€ / ${dailyLimit}€`}
          className="mb-4"
        />
        
        <ActionButtons 
          isStartingSession={isStartingSession}
          onStartSession={handleStartSession}
          onWithdrawal={handleWithdrawal}
          canStartSession={canStartSession && !limitReached && !isNewUser}
          canWithdraw={!isNewUser && displayBalance >= 20}
          subscription={subscription}
          isBotActive={isBotActive}
          useAnimation={true}
        />
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
