
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
  // NOUVEAU: Utiliser le gestionnaire de solde comme source unique de vérité
  const [previousBalance, setPreviousBalance] = useState(balance);
  const [animatedBalance, setAnimatedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    return isNaN(managerBalance) ? balance : managerBalance;
  });
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const [totalGeneratedBalance, setTotalGeneratedBalance] = useState(balance * 1.2);
  const [sessionComplete, setSessionComplete] = useState(false);

  const balanceRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const balanceUpdateCountRef = useRef<number>(0);
  
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Initialiser le solde du gestionnaire si nécessaire
  useEffect(() => {
    if (typeof balance === 'number' && !isNaN(balance) && balance > 0) {
      const currentBalance = balanceManager.getCurrentBalance();
      if (isNaN(currentBalance) || currentBalance === 0) {
        console.log(`Initialisation du balanceManager avec ${balance}€`);
        balanceManager.forceBalanceSync(balance);
      }
    }
  }, [balance]);
  
  // NOUVEAU: Synchroniser immédiatement avec le gestionnaire
  useEffect(() => {
    const currentBalance = balanceManager.getCurrentBalance();
    if (!isNaN(currentBalance) && currentBalance > 0) {
      console.log(`Synchronisation initiale avec balanceManager: ${currentBalance}€`);
      setAnimatedBalance(currentBalance);
    }
  }, []);
  
  // S'abonner aux changements du gestionnaire de solde
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      if (isNaN(newBalance)) return;
      
      // Ne mettre à jour que si le solde est différent pour éviter les boucles
      if (Math.abs(newBalance - animatedBalance) > 0.001) {
        console.log(`Mise à jour depuis le watcher de balanceManager: ${animatedBalance}€ -> ${newBalance}€`);
        setPreviousBalance(animatedBalance);
        setAnimatedBalance(newBalance);
      }
    });
    
    return unsubscribe;
  }, [animatedBalance]);
  
  // Écouter l'événement de session complétée pour animer le solde
  useEffect(() => {
    const handleSessionComplete = (event: CustomEvent) => {
      const gain = event.detail?.gain;
      if (!gain) return;
      
      console.log(`Session complétée reçue avec gain: ${gain}€`);
      setSessionComplete(true);
      setTimeout(() => setSessionComplete(false), 3000);
      
      // Mettre à jour avec animation
      const newBalance = animatedBalance + gain;
      setPreviousBalance(animatedBalance);
      setBalanceAnimating(true);
      
      animateBalanceUpdate(
        animatedBalance,
        newBalance,
        (value) => {
          setAnimatedBalance(value);
          if (Math.abs(value - newBalance) < 0.01) {
            setBalanceAnimating(false);
          }
        },
        1500
      );
    };
    
    window.addEventListener('session:completed' as any, handleSessionComplete);
    
    return () => {
      window.removeEventListener('session:completed' as any, handleSessionComplete);
    };
  }, [animatedBalance]);
  
  // Gérer les événements de mise à jour du solde
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const shouldAnimate = event.detail?.animate !== false;
      
      console.log(`Balance update reçu: ${amount}€, animer: ${shouldAnimate}`);
      
      // Compteur pour éviter les mises à jour trop fréquentes
      balanceUpdateCountRef.current += 1;
      const updateId = balanceUpdateCountRef.current;
      
      // S'il y a un délai en cours, l'annuler
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Ajouter un délai pour regrouper les mises à jour rapides
      updateTimeoutRef.current = setTimeout(() => {
        // Vérifier si c'est toujours la dernière mise à jour demandée
        if (updateId !== balanceUpdateCountRef.current) return;
        
        // Utiliser la valeur du gestionnaire comme source de vérité
        const managerBalance = balanceManager.getCurrentBalance();
        
        if (!isNaN(managerBalance) && managerBalance > 0) {
          if (shouldAnimate && Math.abs(managerBalance - animatedBalance) > 0.01) {
            console.log(`Animation de solde: ${animatedBalance}€ -> ${managerBalance}€`);
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
      
      console.log(`Force update reçu: ${newBalance}€, animer: ${shouldAnimate}`);
      
      if (typeof newBalance === 'number' && !isNaN(newBalance) && newBalance > 0) {
        // Ne pas mettre à jour si la différence est minime
        if (Math.abs(newBalance - animatedBalance) < 0.01) return;
        
        setPreviousBalance(animatedBalance);
        
        if (shouldAnimate) {
          console.log(`Forçage d'animation de solde: ${animatedBalance}€ -> ${newBalance}€`);
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
    
    // S'abonner aux événements de mise à jour du solde
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
  
  // Synchroniser avec la prop balance uniquement si elle est significativement différente
  useEffect(() => {
    const safeBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
    
    if (safeBalance > 0 && Math.abs(safeBalance - animatedBalance) > 0.05) {
      console.log(`Différence significative détectée avec la prop balance: ${safeBalance}€ vs ${animatedBalance}€`);
      const managerBalance = balanceManager.getCurrentBalance();
      
      // Prendre la valeur la plus élevée parmi les trois sources
      const effectiveBalance = Math.max(safeBalance, animatedBalance, managerBalance);
      
      // Mettre à jour uniquement si la différence est significative
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
        
        // S'assurer que le gestionnaire est synchronisé avec la valeur la plus élevée
        if (effectiveBalance > managerBalance) {
          console.log(`Mise à jour forcée du balanceManager: ${managerBalance}€ -> ${effectiveBalance}€`);
          balanceManager.forceBalanceSync(effectiveBalance);
        }
      }
    }
  }, [balance, isNewUser, animatedBalance]);

  // Utiliser le solde du gestionnaire ou la valeur animée
  const displayBalance = isNewUser ? 0 : animatedBalance;

  const balanceCardClass = `shadow-lg overflow-hidden bg-gradient-to-b from-blue-900 to-slate-900 text-white border-none ${sessionComplete ? 'balance-updated pulse-animation' : ''}`;

  return (
    <Card className={balanceCardClass} ref={balanceRef}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          Solde disponible
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
      
      {/* Remplacé le style JSX par une classe CSS définie dans balanceAnimations.css */}
    </Card>
  );
};

export default BalanceCard;
