
import React from 'react';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';

interface BalanceAmountProps {
  isLoading: boolean;
  displayedBalance: number;
  previousBalance: number | null;
  gain: number | null;
  isAnimating: boolean;
  balanceRef: React.RefObject<HTMLDivElement>;
}

const BalanceAmount: React.FC<BalanceAmountProps> = ({
  isLoading,
  displayedBalance,
  previousBalance,
  gain,
  isAnimating,
  balanceRef
}) => {
  return (
    <div ref={balanceRef} className={cn(
      "text-3xl md:text-4xl font-bold text-slate-900 dark:text-white transition-all duration-300",
      isAnimating && "text-green-600 dark:text-green-400"
    )}>
      {isLoading ? (
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      ) : (
        <>
          <CountUp
            start={previousBalance !== null ? previousBalance : displayedBalance - (gain || 0)}
            end={displayedBalance}
            delay={0}
            preserveValue={true}
            decimals={2}
            useEasing={true}
          >
            {({ countUpRef }) => (
              <span ref={countUpRef} />
            )}
          </CountUp>
          €
          {gain && isAnimating && (
            <span className="floating-number">
              +{gain.toFixed(2)}€
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default BalanceAmount;
