
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

export interface BalanceEventDetail {
  newBalance?: number;
  currentBalance?: number;
  gain?: number;
  amount?: number;
  animate?: boolean;
  oldBalance?: number;
}
