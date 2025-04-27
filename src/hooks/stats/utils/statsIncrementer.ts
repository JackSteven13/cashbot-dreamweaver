
import { saveValues, loadStoredValues } from './storageOperations';
import { MAX_ADS_COUNT, MAX_REVENUE_COUNT } from './valueInitializer';

export const incrementDateLinkedStats = () => {
  const { adsCount, revenueCount } = loadStoredValues();
  
  const variationFactor = 0.9 + Math.random() * 0.2;
  const adsIncrement = Math.max(1, Math.floor(Math.random() * 2 + 1) * variationFactor);
  const revenueIncrement = Math.max(0.01, (Math.random() * 0.01 + 0.01) * variationFactor);
  
  const newAdsCount = Math.min(adsCount + adsIncrement, MAX_ADS_COUNT);
  const newRevenueCount = Math.min(revenueCount + revenueIncrement, MAX_REVENUE_COUNT);
  
  saveValues(newAdsCount, newRevenueCount);
  
  return { newAdsCount, newRevenueCount };
};

export const getDailyGains = (): number => {
  const gains = localStorage.getItem('dailyGains');
  return gains ? parseFloat(gains) : 0;
};
