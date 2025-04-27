
import React, { useEffect, useRef } from 'react';
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
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Balance synchronization with prop, using a ref to track update time
  useEffect(() => {
    if (safeBalance > state.displayedBalance) {
      const now = Date.now();
      
      // Clear any pending timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      
      // Prevent immediate updates by using setTimeout
      if (now - refs.lastUpdateTimeRef.current > 5000) {
        // Use timeout to avoid multiple rapid updates
        syncTimeoutRef.current = setTimeout(() => {
          console.log(`Synchronisation du solde affiché avec le prop balance: ${state.displayedBalance} -> ${safeBalance}`);
          setters.setPreviousBalance(state.displayedBalance);
          setters.setDisplayedBalance(safeBalance);
          // Update the update time reference
          refs.lastUpdateTimeRef.current = now;
          balanceManager.forceBalanceSync(safeBalance);
          syncTimeoutRef.current = null;
        }, 100);
      }
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [safeBalance, state.displayedBalance, setters, refs]);

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
