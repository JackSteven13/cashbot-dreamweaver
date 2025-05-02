
/**
 * Calculates minimum values for statistics based on installation time
 */
export const getMinimumValues = () => {
  // Récupérer la date de première utilisation
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    localStorage.setItem('first_use_date', pastDate.toISOString());
  }
  
  // Calculer le nombre de jours depuis l'installation
  const installDate = new Date(localStorage.getItem('first_use_date') || '');
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - installDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Facteur de progression basé sur l'ancienneté - progression pour atteindre des valeurs impressionnantes
  const progressFactor = Math.min(1 + (diffDays * 0.004), 1.8); // max 1.8x après 200 jours
  
  return {
    ADS_COUNT: Math.floor(95000 * progressFactor),
    REVENUE_COUNT: 75000 * progressFactor
  };
};
