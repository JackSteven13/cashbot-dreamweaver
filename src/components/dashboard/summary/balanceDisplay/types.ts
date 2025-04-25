
export interface BalanceData {
  balance: number;
  dailyGains: number;
  dailyLimit: number;
  limitPercentage: number;
  isLimitReached: boolean;
  isNearLimit: boolean;
  effectiveSubscription: string;
}

export interface LimitWarning {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  shouldDisableBot: boolean;
  shouldDisableSessions: boolean;
}
