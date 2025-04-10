
import { SUBSCRIPTION_LIMITS } from '../subscription/constants';

interface GrowthProjection {
  oneMonth: number;
  threeMonths: number;
  twelveMonths: number;
  daysToTarget: number;
}

/**
 * Calcule les projections de croissance financière en fonction du solde actuel et de l'abonnement
 */
export const calculateFutureGrowth = (
  currentBalance: number,
  subscription: string
): GrowthProjection => {
  // Facteurs de croissance selon l'abonnement
  const growthFactors = {
    'freemium': { daily: 0.4, compound: 1.02 },
    'starter': { daily: 3.5, compound: 1.03 },
    'gold': { daily: 14, compound: 1.04 },
    'elite': { daily: 35, compound: 1.05 },
  };
  
  // Valeurs par défaut au cas où l'abonnement n'existe pas dans la liste
  const { daily, compound } = growthFactors[subscription as keyof typeof growthFactors] || 
                            growthFactors.freemium;
  
  // Calculer la limite quotidienne selon l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calcul des projections avec croissance composée
  const oneMonth = calculateCompoundGrowth(currentBalance, daily, 30, compound);
  const threeMonths = calculateCompoundGrowth(currentBalance, daily, 90, compound);
  const twelveMonths = calculateCompoundGrowth(currentBalance, daily, 365, compound);
  
  // Calcul du nombre de jours pour atteindre une "indépendance financière" 
  // (définie comme 10 000€ pour cet exemple)
  const financialFreedomTarget = 10000;
  let daysToTarget = 0;
  let simulatedBalance = currentBalance;
  
  while (simulatedBalance < financialFreedomTarget && daysToTarget < 2000) {
    // Ajouter le gain quotidien plafonné à la limite
    const dailyGain = Math.min(daily, dailyLimit);
    simulatedBalance += dailyGain;
    
    // Appliquer le facteur de croissance composée tous les 30 jours
    if (daysToTarget > 0 && daysToTarget % 30 === 0) {
      simulatedBalance *= compound;
    }
    
    daysToTarget++;
  }
  
  // Limiter à 0 si la projection est négative
  return {
    oneMonth: Math.max(0, oneMonth),
    threeMonths: Math.max(0, threeMonths),
    twelveMonths: Math.max(0, twelveMonths),
    daysToTarget: daysToTarget < 2000 ? daysToTarget : 0
  };
};

/**
 * Calcule la croissance composée sur une période donnée
 */
const calculateCompoundGrowth = (
  startBalance: number,
  dailyAddition: number,
  days: number,
  compoundFactor: number
): number => {
  let balance = startBalance;
  
  for (let day = 1; day <= days; day++) {
    // Ajouter le gain quotidien
    balance += dailyAddition;
    
    // Appliquer le facteur de croissance composée tous les 30 jours
    if (day % 30 === 0) {
      balance *= compoundFactor;
    }
  }
  
  return balance;
};

/**
 * Calcule un montant de revenu mensuel passif basé sur l'accumulation
 */
export const calculatePassiveIncome = (totalAccumulated: number): number => {
  // Simplification: 2% de rendement mensuel sur le capital accumulé
  return totalAccumulated * 0.02;
};

/**
 * Calcule le temps restant jusqu'à un objectif financier
 */
export const calculateTimeToFinancialGoal = (
  currentBalance: number,
  monthlyAddition: number,
  targetAmount: number,
  annualReturnRate: number = 0.05
): number => {
  if (currentBalance >= targetAmount) return 0;
  if (monthlyAddition <= 0) return Infinity;
  
  const monthlyRate = annualReturnRate / 12;
  let balance = currentBalance;
  let months = 0;
  
  while (balance < targetAmount && months < 600) {
    balance += monthlyAddition;
    balance *= (1 + monthlyRate);
    months++;
  }
  
  return months < 600 ? months : -1;
};
