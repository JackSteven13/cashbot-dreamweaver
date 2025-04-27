
export interface BalanceSetters {
  setDisplayedBalance: React.Dispatch<React.SetStateAction<number>>;
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviousBalance: React.Dispatch<React.SetStateAction<number | null>>;
  setGain: React.Dispatch<React.SetStateAction<number | null>>;
}

export interface BalanceRefs {
  balanceRef: React.RefObject<HTMLDivElement>;
  lastUpdateTimeRef: React.RefObject<number>;
  forceUpdateTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
}

export interface BalanceEventDetail {
  newBalance?: number;
  currentBalance?: number;
  gain?: number;
  amount?: number;
  animate?: boolean;
  oldBalance?: number;
  userId?: string;  // Add userId to the type definition
}

export interface UseBalanceStateResult {
  state: {
    displayedBalance: number;
    isAnimating: boolean;
    previousBalance: number | null;
    gain: number | null;
  };
  refs: BalanceRefs;
  setters: BalanceSetters;
  constants: {
    updateDebounceTime: number;
  };
}
