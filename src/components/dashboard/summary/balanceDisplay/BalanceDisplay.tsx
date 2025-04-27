
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
  
  useEffect(() => {
    if (safeBalance > state.displayedBalance) {
      const now = Date.now();
      // Update using a new object instead of modifying current directly
      if (now - refs.lastUpdateTimeRef.current > 5000) {
        console.log(`Synchronisation du solde affiché avec le prop balance: ${state.displayedBalance} -> ${safeBalance}`);
        setters.setPreviousBalance(state.displayedBalance);
        setters.setDisplayedBalance(safeBalance);
        // Fix: Store the update time in a mutable variable without directly setting the ref
        const lastUpdateTime = now;
        // Use refs during the next render cycle
        const timerId = window.setTimeout(() => {
          // By the time this callback runs, the ref will be defined properly
          if (refs.lastUpdateTimeRef) {
            // This is safe as it's being done inside a callback
            const refObject = refs.lastUpdateTimeRef;
            refObject.current = lastUpdateTime;
          }
        }, 0);
        
        // Clean up the timeout if component unmounts
        return () => window.clearTimeout(timerId);
        
        balanceManager.forceBalanceSync(safeBalance);
      }
    }
  }, [safeBalance, state.displayedBalance]);

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
