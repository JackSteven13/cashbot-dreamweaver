
export type BalanceWatcher = (newBalance: number) => void;

export interface BalanceEvent {
  newBalance: number;
  userId: string | null;
}

export interface BalanceStorageKeys {
  currentBalance: string;
  lastKnownBalance: string;
  lastUpdatedBalance: string;
  sessionCurrentBalance: string;
  highestBalance: string;
}
