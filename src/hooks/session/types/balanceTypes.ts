
export interface BalanceOperationsProps {
  userId?: string;
  initialBalance?: number;
}

export interface BalanceUpdateResult {
  success: boolean;
  newBalance?: number;
  limitReached?: boolean;
  transaction?: {
    date: string;
    gain: number;
    report: string;
  };
}

export interface Transaction {
  date: string;
  gain: number;
  report: string;
}
