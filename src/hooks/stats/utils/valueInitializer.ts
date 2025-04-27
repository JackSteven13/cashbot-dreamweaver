
const MINIMUM_ADS_COUNT = 36742;
const MINIMUM_REVENUE_COUNT = 23918;
const DAILY_PROGRESSIVE_FACTOR = 0.0002;
const MAX_ADS_COUNT = 152847;
const MAX_REVENUE_COUNT = 116329;

export const initializeFirstUseDate = () => {
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    try {
      localStorage.setItem('first_use_date', pastDate.toISOString());
    } catch (e) {
      console.error("Failed to save first use date:", e);
    }
  }
  return firstUseDate;
};

export {
  MINIMUM_ADS_COUNT,
  MINIMUM_REVENUE_COUNT,
  DAILY_PROGRESSIVE_FACTOR,
  MAX_ADS_COUNT,
  MAX_REVENUE_COUNT
};
