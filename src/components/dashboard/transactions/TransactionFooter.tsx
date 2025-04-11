
import React, { useEffect, useState, useRef } from 'react';

interface TransactionFooterProps {
  showAllTransactions: boolean;
  hiddenTransactionsCount: number;
}

const TransactionFooter = ({ 
  showAllTransactions, 
  hiddenTransactionsCount 
}: TransactionFooterProps) => {
  const [localCount, setLocalCount] = useState(hiddenTransactionsCount);
  const isMountedRef = useRef(true);
  const localStorageKey = 'hiddenTransactionsCount';
  
  // Effect for persistence with better cleanup
  useEffect(() => {
    if (hiddenTransactionsCount > 0) {
      try {
        localStorage.setItem(localStorageKey, hiddenTransactionsCount.toString());
        setLocalCount(hiddenTransactionsCount);
      } catch (e) {
        console.error("Failed to store transaction count:", e);
      }
    } else {
      // Try to retrieve from localStorage
      try {
        const storedCount = localStorage.getItem(localStorageKey);
        if (storedCount && isMountedRef.current) {
          const count = parseInt(storedCount, 10);
          if (!isNaN(count) && count > 0) {
            setLocalCount(count);
          }
        }
      } catch (e) {
        console.error("Failed to retrieve transaction count:", e);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [hiddenTransactionsCount]);
  
  // Don't render anything if showing all transactions or no hidden transactions
  if (showAllTransactions || localCount <= 0) return null;
  
  return (
    <div className="text-center mt-4">
      <p className="text-sm text-[#486581]">
        {localCount} {localCount > 1 ? 'autres sessions' : 'autre session'} non affichée{localCount > 1 ? 's' : ''}.
      </p>
    </div>
  );
};

export default TransactionFooter;
