
export type BalanceWatcher = (newBalance: number) => void;

export interface BalanceManagerState {
  currentBalance: number;
  highestBalance: number;
  dailyGains: number;
  userId: string | null;
}

export interface StorageKeys {
  currentBalance: string;
  lastKnownBalance: string;
  highestBalance: string;
  dailyGains: string;
}
