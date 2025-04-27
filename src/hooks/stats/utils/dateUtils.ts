
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getProgressFactor = (daysSinceInstall: number): number => {
  return Math.min(daysSinceInstall * 0.001 * (0.9 + Math.random() * 0.2), 0.08);
};
