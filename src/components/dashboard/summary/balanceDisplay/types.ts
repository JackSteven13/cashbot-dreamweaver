
export interface BalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
}

export interface BalanceState {
  displayedBalance: number;
  isAnimating: boolean;
  previousBalance: number | null;
  gain: number | null;
}

export interface BalanceRefs {
  balanceRef: React.RefObject<HTMLDivElement>;
  lastUpdateTimeRef: React.RefObject<number>;
  forceUpdateTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
}

export interface BalanceSetters {
  setDisplayedBalance: (value: number) => void;
  setIsAnimating: (value: boolean) => void;
  setPreviousBalance: (value: number | null) => void;
  setGain: (value: number | null) => void;
}

export interface BalanceConstants {
  updateDebounceTime: number;
}

export interface UseBalanceStateResult {
  state: BalanceState;
  refs: BalanceRefs;
  setters: BalanceSetters;
  constants: BalanceConstants;
}

export interface BalanceEventDetail {
  newBalance?: number;
  currentBalance?: number;
  gain?: number;
  amount?: number;
  animate?: boolean;
  oldBalance?: number;
}

