
export interface UseStatsCounterParams {
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export interface StatsCounterData {
  displayedAdsCount: number;
  displayedRevenueCount: number;
}

export interface StableValuesRef {
  initialized: boolean;
  syncInProgress: boolean;
  lastAutoIncrementTime: number;
  lastLocationUpdateTime: number;
  baseValues: {
    adsCount: number;
    revenueCount: number;
  }
}
