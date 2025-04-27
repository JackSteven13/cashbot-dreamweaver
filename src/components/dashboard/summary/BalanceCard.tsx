
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
  const [animatedBalance, setAnimatedBalance] = useState(balance);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [totalGeneratedBalance, setTotalGeneratedBalance] = useState(balance * 1.2);

  const balanceRef = useRef<HTMLDivElement>(null);
  
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (typeof currentBalance === 'number' && currentBalance > 0) {
        if (shouldAnimate && currentBalance !== animatedBalance) {
          setPreviousBalance(animatedBalance);
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            currentBalance,
            (value) => {
              setAnimatedBalance(value);
              if (value === currentBalance) setBalanceAnimating(false);
            },
            1500
          );
        } else {
          setAnimatedBalance(currentBalance);
        }
      } else if (typeof amount === 'number' && amount > 0) {
        const newBalance = animatedBalance + amount;
        
        if (shouldAnimate) {
          setPreviousBalance(animatedBalance);
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            newBalance,
            (value) => {
              setAnimatedBalance(value);
              if (value === newBalance) setBalanceAnimating(false);
            },
            1500
          );
        } else {
          setAnimatedBalance(newBalance);
        }
      }
    };
    
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      const gain = event.detail?.gain;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        setPreviousBalance(animatedBalance);
        
        if (shouldAnimate && newBalance !== animatedBalance) {
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            newBalance,
            (value) => {
              setAnimatedBalance(value);
              
              balanceManager.updateBalance(value - animatedBalance);
              
              if (value === newBalance) setBalanceAnimating(false);
            },
            1500
          );
        } else {
          setAnimatedBalance(newBalance);
          balanceManager.updateBalance(newBalance - animatedBalance);
        }
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:reset-complete' as any, () => {
      setPreviousBalance(0);
      setAnimatedBalance(0);
      balanceManager.updateBalance(0);
    });
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:reset-complete' as any, () => {});
    };
  }, [animatedBalance]);
  
  useEffect(() => {
    const safeBalance = typeof balance === 'number' ? balance : 0;
    
    if (Math.abs(safeBalance - animatedBalance) > 0.01) {
      setPreviousBalance(animatedBalance);
      setBalanceAnimating(true);
      
      animateBalanceUpdate(
        animatedBalance,
        safeBalance,
        (value) => {
          setAnimatedBalance(value);
          
          if (value === safeBalance) {
            balanceManager.updateBalance(0);
            setBalanceAnimating(false);
          }
        },
        1000
      );
    }
  }, [balance]);

  return (
    <Card className="shadow-lg overflow-hidden bg-gradient-to-b from-blue-900 to-slate-900 text-white border-none" ref={balanceRef}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          Solde disponible
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4">
        <BalanceDisplay 
          displayBalance={isNewUser ? 0 : (balance || 0)}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={totalGeneratedBalance}
          isBotActive={isBotActive}
          subscription={subscription}
        />
        
        <GainProgress 
          currentGain={isNewUser ? 0 : (balance || 0)}
          subscription={subscription}
          currentValue={isNewUser ? 0 : (balance || 0)} 
          maxValue={dailyLimit} 
          showTooltip={true} 
          tooltipText={`Progression: ${isNewUser ? 0 : (balance || 0)}€ / ${dailyLimit}€`}
          className="mb-4"
        />
        
        <ActionButtons 
          isStartingSession={isStartingSession}
          onStartSession={handleStartSession}
          onWithdrawal={handleWithdrawal}
          canWithdraw={!isNewUser && (balance || 0) >= 20}
          subscription={subscription}
          isBotActive={isBotActive}
          useAnimation={true}
          dailySessionCount={0}
        />
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
