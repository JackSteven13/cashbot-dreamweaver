
export const getMinimumValues = () => {
  // Get the date of first use
  const firstUseDate = localStorage.getItem('first_use_date');
  if (!firstUseDate) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    try {
      localStorage.setItem('first_use_date', pastDate.toISOString());
    } catch (e) {
      console.error("Failed to save first use date:", e);
    }
  }
  
  // Calculate days since installation
  let diffDays = 60; // Default value
  try {
    const installDate = new Date(localStorage.getItem('first_use_date') || '');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - installDate.getTime());
    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    console.error("Failed to calculate diff days:", e);
  }
  
  // Progress factor based on age
  const progressFactor = Math.min(1 + (diffDays * 0.004), 1.8);
  
  return {
    ADS_COUNT: Math.floor(95000 * progressFactor),
    REVENUE_COUNT: 75000 * progressFactor
  };
};
