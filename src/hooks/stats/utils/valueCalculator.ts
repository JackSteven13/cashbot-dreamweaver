
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Valeurs de base plus encourageantes
  const minBaseAds = 12000 + Math.floor(Math.random() * 3000); // 12,000-15,000
  const minBaseRevenue = 15000 + Math.floor(Math.random() * 5000); // 15,000-20,000
  
  // Ajuster les multiplicateurs pour des valeurs plus réalistes
  const baseAdsMultiplier = 0.015 + (Math.random() * 0.005); // 1.5-2%
  const baseRevenueMultiplier = 0.018 + (Math.random() * 0.007); // 1.8-2.5%
  
  // Calculer les valeurs initiales avec une petite variation aléatoire
  const initialAds = Math.floor(minBaseAds * (1 + baseAdsMultiplier));
  const initialRevenue = Math.floor(minBaseRevenue * (1 + baseRevenueMultiplier));
  
  return { initialAds, initialRevenue };
};
