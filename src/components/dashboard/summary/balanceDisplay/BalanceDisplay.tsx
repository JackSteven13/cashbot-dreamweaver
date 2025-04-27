
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
  
  // Balance synchronization with prop
  useEffect(() => {
    if (safeBalance > state.displayedBalance) {
      const now = Date.now();
      
      // Prevent immediate updates by using setTimeout
      if (now - refs.lastUpdateTimeRef.current > 5000) {
        console.log(`Synchronisation du solde affiché avec le prop balance: ${state.displayedBalance} -> ${safeBalance}`);
        setters.setPreviousBalance(state.displayedBalance);
        setters.setDisplayedBalance(safeBalance);
        // Update the update time reference
        refs.lastUpdateTimeRef.current = now;
        balanceManager.forceBalanceSync(safeBalance);
      }
    }
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
