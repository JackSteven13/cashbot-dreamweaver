
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
  balance,
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
  // État interne pour l'animation du solde
  const [previousBalance, setPreviousBalance] = useState(balance);
  const [animatedBalance, setAnimatedBalance] = useState(balance);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [totalGeneratedBalance, setTotalGeneratedBalance] = useState(balance * 1.2);

  const balanceRef = useRef<HTMLDivElement>(null);
  
  // Obtenir la limite en fonction de l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Écouter les mises à jour de solde pour les animations
  useEffect(() => {
    // La mise à jour du composant à partir des propriétés est gérée séparément
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (typeof currentBalance === 'number' && currentBalance > 0) {
        // Si un solde complet est fourni, l'utiliser
        if (shouldAnimate && currentBalance !== animatedBalance) {
          // Animer la transition du solde
          setPreviousBalance(animatedBalance);
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            currentBalance,
            1500,
            (value) => {
              setAnimatedBalance(value);
            },
            undefined,
            () => {
              setBalanceAnimating(false);
            }
          );
        } else {
          // Mise à jour instantanée sans animation
          setAnimatedBalance(currentBalance);
        }
      } else if (typeof amount === 'number' && amount > 0) {
        // Sinon ajouter le montant au solde actuel
        const newBalance = animatedBalance + amount;
        
        if (shouldAnimate) {
          setPreviousBalance(animatedBalance);
          setBalanceAnimating(true);
          
          animateBalanceUpdate(
            animatedBalance,
            newBalance,
            1500,
            (value) => {
              setAnimatedBalance(value);
            },
            undefined,
            () => {
              setBalanceAnimating(false);
            }
          );
        } else {
          // Mise à jour instantanée sans animation
          setAnimatedBalance(newBalance);
        }
      }
    };
    
    // Forcer la synchronisation du solde
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      const gain = event.detail?.gain;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        // Sauvegarder l'état actuel pour l'animation
        setPreviousBalance(animatedBalance);
        
        if (shouldAnimate && newBalance !== animatedBalance) {
          setBalanceAnimating(true);
          
          // Animer la transition du solde vers la nouvelle valeur
          animateBalanceUpdate(
            animatedBalance,
            newBalance,
            1500,
            (value) => {
              setAnimatedBalance(value);
              
              // Mettre à jour le gestionnaire de solde pour les références persistantes
              balanceManager.updateBalance(value);
            },
            undefined,
            () => {
              setBalanceAnimating(false);
            }
          );
        } else {
          // Mise à jour instantanée sans animation
          setAnimatedBalance(newBalance);
          balanceManager.updateBalance(newBalance);
        }
      }
    };

    // S'abonner aux événements globaux de mise à jour du solde
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
  
  // Synchroniser avec la prop balance lorsqu'elle change significativement
  useEffect(() => {
    if (Math.abs(balance - animatedBalance) > 0.01) {
      // Si le solde a changé significativement, mettre à jour avec animation
      setPreviousBalance(animatedBalance);
      setBalanceAnimating(true);
      
      animateBalanceUpdate(
        animatedBalance,
        balance,
        1000,
        (value) => {
          setAnimatedBalance(value);
          
          // Mettre à jour le gestionnaire de solde pour les références persistantes
          balanceManager.updateBalance(value);
        },
        undefined,
        () => {
          setBalanceAnimating(false);
        }
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
          displayBalance={isNewUser ? 0 : balance}
          balanceAnimating={balanceAnimating}
          animatedBalance={animatedBalance}
          previousBalance={previousBalance}
          referralBonus={referralBonus}
          totalGeneratedBalance={totalGeneratedBalance}
          isBotActive={isBotActive}
          subscription={subscription}
        />
        
        <GainProgress 
          currentValue={isNewUser ? 0 : balance} 
          maxValue={dailyLimit} 
          showTooltip={true} 
          tooltipText={`Progression: ${isNewUser ? 0 : balance}€ / ${dailyLimit}€`}
          className="mb-4"
        />
        
        <ActionButtons 
          isStartingSession={isStartingSession}
          onStartSession={handleStartSession}
          onWithdrawal={handleWithdrawal}
          canStartSession={canStartSession && !limitReached && !isNewUser}
          canWithdraw={!isNewUser && balance >= 20}
          subscription={subscription}
          isBotActive={isBotActive}
          useAnimation={true}
        />
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
