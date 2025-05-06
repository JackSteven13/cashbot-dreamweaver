
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import balanceManager from '@/utils/balance/balanceManager';
import { BalanceDisplayProps } from './types';
import { useBalanceState } from './useBalanceState';
import { useBalanceEvents } from './useBalanceEvents';
import { useIntervalChecks } from '@/hooks/sessions/useIntervalChecks';
import BalanceHeader from './BalanceHeader';
import BalanceAmount from './BalanceAmount';

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  balance, 
  isLoading = false, 
  currency, 
  subscription 
}) => {
  const safeBalance = isNaN(balance) ? 0 : balance;
  const { state, refs, setters, constants } = useBalanceState(safeBalance);
  
  // Force the balance to update when the prop changes significantly
  useEffect(() => {
    if (safeBalance > 0 && Math.abs(safeBalance - state.displayedBalance) > 0.01) {
      console.log(`Synchronisation du solde depuis les props: ${state.displayedBalance.toFixed(2)} -> ${safeBalance.toFixed(2)}`);
      setters.setPreviousBalance(state.displayedBalance);
      setters.setDisplayedBalance(safeBalance);
      balanceManager.forceBalanceSync(safeBalance);
    }
  }, [safeBalance, state.displayedBalance, setters]);

  // Listen for manual session events
  useEffect(() => {
    const handleSessionCompleted = (event: CustomEvent) => {
      if (event.detail && event.detail.gain) {
        console.log(`BalanceDisplay: Session completed event received with gain ${event.detail.gain}€`);
        
        // Update display with animation
        setters.setPreviousBalance(state.displayedBalance);
        setters.setDisplayedBalance(state.displayedBalance + event.detail.gain);
        setters.setGain(event.detail.gain);
        setters.setIsAnimating(true);
        
        // Reset animation after a delay
        setTimeout(() => {
          setters.setIsAnimating(false);
          setters.setGain(null);
        }, 3000);
      }
    };
    
    // Listen for force update events
    const handleForceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.newBalance !== undefined) {
        console.log(`BalanceDisplay: Force update event received with new balance ${event.detail.newBalance}€`);
        
        // Update display without animation
        setters.setDisplayedBalance(event.detail.newBalance);
        balanceManager.forceBalanceSync(event.detail.newBalance);
      }
    };
    
    // Listen for balance update events
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail) {
        const { amount, animate, newBalance } = event.detail;
        console.log(`useBalanceState: Event balance:update reçu, gain: ${amount}€, nouveau solde: ${newBalance || (state.displayedBalance + amount)}€`);
        
        if (newBalance !== undefined) {
          // Si un nouveau solde est spécifié, l'utiliser directement
          setters.setPreviousBalance(state.displayedBalance);
          setters.setDisplayedBalance(newBalance);
          if (animate) setters.setIsAnimating(true);
        } else if (amount !== undefined) {
          // Sinon, ajouter le montant au solde actuel
          setters.setPreviousBalance(state.displayedBalance);
          setters.setDisplayedBalance(state.displayedBalance + amount);
          if (animate) {
            setters.setGain(amount);
            setters.setIsAnimating(true);
          }
        }
        
        // Réinitialiser l'animation après un délai
        if (animate) {
          setTimeout(() => {
            setters.setIsAnimating(false);
            setters.setGain(null);
          }, 3000);
        }
      }
    };
    
    window.addEventListener('session:completed', handleSessionCompleted as EventListener);
    window.addEventListener('balance:force-update', handleForceUpdate as EventListener);
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('session:completed', handleSessionCompleted as EventListener);
      window.removeEventListener('balance:force-update', handleForceUpdate as EventListener);
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
    };
  }, [state.displayedBalance, setters]);

  useBalanceEvents({
    displayedBalance: state.displayedBalance,
    setters,
    refs,
    updateDebounceTime: constants.updateDebounceTime
  });

  useIntervalChecks({
    displayedBalance: state.displayedBalance,
    setDisplayedBalance: setters.setDisplayedBalance,
    setPreviousBalance: setters.setPreviousBalance
  });
  
  return (
    <Card className={cn(
      "balance-display hover:shadow-md transition-all duration-300",
      state.isAnimating && "pulse-animation"
    )}>
      <CardContent className="p-6 flex flex-col">
        <BalanceHeader />
        <div className="relative">
          <BalanceAmount
            isLoading={isLoading}
            displayedBalance={state.displayedBalance}
            previousBalance={state.previousBalance}
            gain={state.gain}
            isAnimating={state.isAnimating}
            balanceRef={refs.balanceRef}
            currency={currency}
            subscription={subscription}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
